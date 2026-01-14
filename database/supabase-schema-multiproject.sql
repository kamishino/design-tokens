-- ============================================================================
-- Supabase Multi-Tenant Database Schema for Design Token Management
-- PRD 0051: Multi-Project Engine with Inheritance
-- 
-- This schema supports:
-- - Multi-organization architecture
-- - 3-tier inheritance: Global -> Project -> Brand
-- - Role-Based Access Control (RBAC)
-- - Version snapshots and releases
-- - Automated CI/CD triggers
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES: Multi-Tenant Structure
-- ============================================================================

-- Organizations: Top-level entities for grouping projects
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects: Individual applications or platforms within an organization
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  git_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Brands: Visual variants of a project (e.g., dark mode, seasonal themes)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, slug)
);

-- ============================================================================
-- TOKEN STORAGE: Individual tokens with inheritance support
-- ============================================================================

-- Tokens: Individual design token storage (replaces file-based approach)
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Inheritance hierarchy (nullable for global tokens)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Token identity
  token_path TEXT NOT NULL, -- e.g., "color.primary.500"
  token_type TEXT NOT NULL, -- e.g., "color", "dimension", "typography"
  
  -- Token value (stored as JSONB for flexibility)
  value JSONB NOT NULL, -- Can store primitive values or complex objects
  
  -- Metadata
  description TEXT,
  is_global BOOLEAN DEFAULT false, -- True if this is a global token
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure token path is unique within its scope
  CONSTRAINT unique_token_scope UNIQUE NULLS NOT DISTINCT (organization_id, project_id, brand_id, token_path),
  
  -- Check: Global tokens should not have org/project/brand associations
  CONSTRAINT check_global_token CHECK (
    (is_global = true AND organization_id IS NULL AND project_id IS NULL AND brand_id IS NULL) OR
    (is_global = false)
  )
);

-- ============================================================================
-- VERSIONING & RELEASES
-- ============================================================================

-- Token Versions: Snapshots of resolved token sets for specific brands
CREATE TABLE IF NOT EXISTS token_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL, -- Semantic version: "1.2.3"
  snapshot_json JSONB NOT NULL, -- Complete resolved token set
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(brand_id, version_number)
);

-- Releases: Track build and deployment status
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES token_versions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, building, success, failed
  build_url TEXT, -- GitHub Actions run URL
  cdn_url TEXT, -- Supabase Storage URL for built assets
  error_log TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- USER MANAGEMENT & RBAC
-- ============================================================================

-- User Profiles: Extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles: Project-level role assignments
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, project_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_brands_project_id ON brands(project_id);
CREATE INDEX IF NOT EXISTS idx_tokens_org_id ON tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_tokens_project_id ON tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_tokens_brand_id ON tokens(brand_id);
CREATE INDEX IF NOT EXISTS idx_tokens_path ON tokens(token_path);
CREATE INDEX IF NOT EXISTS idx_tokens_global ON tokens(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_token_versions_brand ON token_versions(brand_id);
CREATE INDEX IF NOT EXISTS idx_releases_version ON releases(version_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_project ON user_roles(project_id);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all relevant tables
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tokens_updated_at ON tokens;
CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TOKEN INHERITANCE RESOLVER FUNCTION
-- ============================================================================

-- Function to resolve tokens for a specific brand with inheritance
-- Inheritance order: Brand (highest priority) -> Project -> Global (lowest priority)
CREATE OR REPLACE FUNCTION resolve_brand_tokens(target_brand_id UUID)
RETURNS TABLE (
  token_path TEXT,
  token_type TEXT,
  value JSONB,
  source_level TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH brand_info AS (
    SELECT b.id as brand_id, b.project_id, p.organization_id
    FROM brands b
    JOIN projects p ON b.project_id = p.id
    WHERE b.id = target_brand_id
  ),
  prioritized_tokens AS (
    -- Brand-level tokens (priority 1)
    SELECT 
      t.token_path,
      t.token_type,
      t.value,
      'brand' as source_level,
      t.description,
      1 as priority
    FROM tokens t
    WHERE t.brand_id = target_brand_id
    
    UNION ALL
    
    -- Project-level tokens (priority 2)
    SELECT 
      t.token_path,
      t.token_type,
      t.value,
      'project' as source_level,
      t.description,
      2 as priority
    FROM tokens t, brand_info bi
    WHERE t.project_id = bi.project_id
      AND t.brand_id IS NULL
    
    UNION ALL
    
    -- Global tokens (priority 3)
    SELECT 
      t.token_path,
      t.token_type,
      t.value,
      'global' as source_level,
      t.description,
      3 as priority
    FROM tokens t
    WHERE t.is_global = true
  ),
  deduplicated AS (
    SELECT DISTINCT ON (pt.token_path)
      pt.token_path,
      pt.token_type,
      pt.value,
      pt.source_level,
      pt.description
    FROM prioritized_tokens pt
    ORDER BY pt.token_path, pt.priority ASC
  )
  SELECT * FROM deduplicated
  ORDER BY token_path;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- DATABASE VIEWS FOR QUICK ACCESS
-- ============================================================================

-- View: Quick lookup of resolved tokens for all brands
CREATE OR REPLACE VIEW resolved_tokens_view AS
SELECT 
  b.id as brand_id,
  b.slug as brand_slug,
  p.id as project_id,
  p.slug as project_slug,
  o.id as organization_id,
  o.slug as organization_slug,
  t.token_path,
  t.token_type,
  t.value,
  t.source_level,
  t.description
FROM brands b
JOIN projects p ON b.project_id = p.id
JOIN organizations o ON p.organization_id = o.id
CROSS JOIN LATERAL resolve_brand_tokens(b.id) t;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: Organizations
-- ============================================================================

-- Anyone can read organizations (public discovery)
CREATE POLICY "Anyone can read organizations"
  ON organizations FOR SELECT
  USING (true);

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Organization admins can update their organization
CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN projects p ON ur.project_id = p.id
      WHERE p.organization_id = organizations.id
        AND ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: Projects
-- ============================================================================

-- Anyone can read projects
CREATE POLICY "Anyone can read projects"
  ON projects FOR SELECT
  USING (true);

-- Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Project admins can update their projects
CREATE POLICY "Admins can update their projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.project_id = projects.id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: Brands
-- ============================================================================

-- Anyone can read brands
CREATE POLICY "Anyone can read brands"
  ON brands FOR SELECT
  USING (true);

-- Editors and admins can create brands
CREATE POLICY "Editors can create brands"
  ON brands FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.project_id = brands.project_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'editor')
    )
  );

-- Editors and admins can update brands
CREATE POLICY "Editors can update brands"
  ON brands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.project_id = brands.project_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'editor')
    )
  );

-- ============================================================================
-- RLS POLICIES: Tokens
-- ============================================================================

-- Anyone can read tokens (for public token discovery)
CREATE POLICY "Anyone can read tokens"
  ON tokens FOR SELECT
  USING (true);

-- Editors can create/update tokens in their projects
CREATE POLICY "Editors can create tokens"
  ON tokens FOR INSERT
  WITH CHECK (
    -- Global tokens: must be admin
    (tokens.is_global = true AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ))
    OR
    -- Project/Brand tokens: must have editor or admin role
    (tokens.is_global = false AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.project_id = tokens.project_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'editor')
    ))
  );

CREATE POLICY "Editors can update tokens"
  ON tokens FOR UPDATE
  USING (
    -- Same logic as INSERT
    (tokens.is_global = true AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ))
    OR
    (tokens.is_global = false AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.project_id = tokens.project_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'editor')
    ))
  );

CREATE POLICY "Editors can delete tokens"
  ON tokens FOR DELETE
  USING (
    (tokens.is_global = true AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ))
    OR
    (tokens.is_global = false AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.project_id = tokens.project_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'editor')
    ))
  );

-- ============================================================================
-- RLS POLICIES: User Management
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can read roles for projects they have access to
CREATE POLICY "Users can read accessible roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.project_id = user_roles.project_id
        AND ur.user_id = auth.uid()
    )
  );

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.project_id = user_roles.project_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to create sample data:
/*
-- Sample Organization
INSERT INTO organizations (name, slug) VALUES 
  ('Acme Corporation', 'acme');

-- Sample Projects
INSERT INTO projects (organization_id, name, slug, git_url) 
SELECT 
  id,
  'Customer Portal',
  'customer-portal',
  'https://github.com/acme/customer-portal-tokens'
FROM organizations WHERE slug = 'acme';

-- Sample Brands
INSERT INTO brands (project_id, name, slug, is_default)
SELECT 
  id,
  'Default Theme',
  'default',
  true
FROM projects WHERE slug = 'customer-portal';

INSERT INTO brands (project_id, name, slug)
SELECT 
  id,
  'Dark Mode',
  'dark'
FROM projects WHERE slug = 'customer-portal';

-- Sample Global Tokens
INSERT INTO tokens (token_path, token_type, value, is_global, description)
VALUES 
  ('color.blue.500', 'color', '"#3b82f6"'::jsonb, true, 'Primary blue color'),
  ('spacing.base', 'dimension', '"16px"'::jsonb, true, 'Base spacing unit'),
  ('font.family.sans', 'fontFamily', '["Inter", "sans-serif"]'::jsonb, true, 'Sans-serif font stack');
*/

-- ============================================================================
-- MIGRATION HELPER: Legacy Data Compatibility
-- ============================================================================

-- Keep old tables for backward compatibility (optional)
-- The original `projects` and `token_drafts` tables can coexist
-- Migration script can move data from old schema to new schema

COMMENT ON TABLE organizations IS 'PRD 0051: Top-level organizational entities';
COMMENT ON TABLE projects IS 'PRD 0051: Individual projects within organizations';
COMMENT ON TABLE brands IS 'PRD 0051: Visual variants of projects';
COMMENT ON TABLE tokens IS 'PRD 0051: Individual design tokens with inheritance support';
COMMENT ON TABLE token_versions IS 'PRD 0051: Versioned snapshots for releases';
COMMENT ON TABLE releases IS 'PRD 0051: Build and deployment tracking';
COMMENT ON FUNCTION resolve_brand_tokens IS 'PRD 0051: Resolves tokens with Brand -> Project -> Global inheritance';
