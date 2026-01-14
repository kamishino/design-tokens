-- ============================================================================
-- Migration Script: Legacy Schema to Multi-Project Schema
-- PRD 0051: Migrates data from old simple schema to new multi-tenant schema
-- ============================================================================

-- This script helps migrate existing data from the legacy schema
-- (simple projects + token_drafts) to the new multi-tenant structure

-- ============================================================================
-- STEP 1: Create a default organization
-- ============================================================================

-- Insert a default organization for existing projects
INSERT INTO organizations (name, slug)
VALUES ('Default Organization', 'default-org')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- STEP 2: Migrate existing projects
-- ============================================================================

-- Migrate projects from legacy schema to new schema
-- Assumes legacy projects table exists with columns: id, name, git_url
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the default organization ID
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-org';
  
  -- Check if legacy projects table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
    AND EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'name'
      AND column_name NOT IN (SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'organization_id')
    )
  ) THEN
    -- Legacy projects table exists without organization_id
    -- Add organization_id column if it doesn't exist
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;
    
    -- Update existing projects with default org and generate slugs
    UPDATE projects 
    SET 
      organization_id = default_org_id,
      slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
    WHERE organization_id IS NULL;
    
    RAISE NOTICE 'Migrated existing projects to default organization';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create default brands for migrated projects
-- ============================================================================

-- Create a default brand for each project that doesn't have one
INSERT INTO brands (project_id, name, slug, is_default)
SELECT 
  p.id,
  'Default',
  'default',
  true
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM brands b WHERE b.project_id = p.id
);

-- ============================================================================
-- STEP 4: Migrate token_drafts to new tokens table
-- ============================================================================

-- This is a complex migration because token_drafts stores entire JSON files
-- while the new tokens table stores individual tokens
-- This script provides a framework - actual migration may need customization

DO $$
DECLARE
  draft_record RECORD;
  token_key TEXT;
  token_value JSONB;
  brand_id UUID;
BEGIN
  -- Check if token_drafts table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'token_drafts'
  ) THEN
    
    RAISE NOTICE 'Starting token_drafts migration...';
    
    -- Loop through each draft
    FOR draft_record IN 
      SELECT 
        td.id,
        td.project_id,
        td.file_path,
        td.content_json
      FROM token_drafts td
    LOOP
      -- Get the default brand for this project
      SELECT id INTO brand_id 
      FROM brands 
      WHERE project_id = draft_record.project_id 
        AND is_default = true
      LIMIT 1;
      
      -- Note: This is a simplified migration
      -- Real implementation would need to recursively parse the JSON structure
      -- and extract individual tokens with proper paths
      
      -- Example: If content_json is {"color": {"primary": {"value": "#ff0000"}}}
      -- You would create: token_path = "color.primary", value = "#ff0000"
      
      RAISE NOTICE 'Processing draft for project %, file %', 
        draft_record.project_id, draft_record.file_path;
      
      -- TODO: Implement actual JSON parsing and token extraction
      -- This requires recursive traversal of the JSON structure
      
    END LOOP;
    
    RAISE NOTICE 'Token drafts migration framework executed. Manual token extraction may be required.';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Verification Queries
-- ============================================================================

-- Check migration results
DO $$
BEGIN
  RAISE NOTICE '=== Migration Verification ===';
  RAISE NOTICE 'Organizations: %', (SELECT COUNT(*) FROM organizations);
  RAISE NOTICE 'Projects: %', (SELECT COUNT(*) FROM projects);
  RAISE NOTICE 'Brands: %', (SELECT COUNT(*) FROM brands);
  RAISE NOTICE 'Tokens: %', (SELECT COUNT(*) FROM tokens);
END $$;

-- ============================================================================
-- NOTES FOR MANUAL MIGRATION
-- ============================================================================

/*
IMPORTANT: Token Content Migration

The legacy token_drafts table stores entire JSON files in content_json.
The new tokens table stores individual tokens.

To complete the migration, you need to:

1. Parse each token_drafts.content_json recursively
2. Extract individual tokens with their paths
3. Insert each token into the tokens table

Example Python/Node.js script would be needed to:
- Read token_drafts records
- Recursively traverse the JSON
- Build token paths (e.g., "color.primary.500")
- Extract token type and value
- Insert into tokens table

Example token structure:
{
  "color": {
    "primary": {
      "500": {
        "value": "#3b82f6",
        "$type": "color",
        "$description": "Primary blue"
      }
    }
  }
}

Would become:
INSERT INTO tokens (brand_id, token_path, token_type, value, description)
VALUES (
  '<brand-uuid>',
  'color.primary.500',
  'color',
  '"#3b82f6"'::jsonb,
  'Primary blue'
);
*/
