-- Migration: Add soft delete support to multi-project entities
-- PRD 0062: Entity Management & Governance
-- Date: 2026-01-15

-- Add deleted_at column to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at column to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at column to brands
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add indexes for better query performance on soft delete checks
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_brands_deleted_at ON brands(deleted_at);

-- Add comments for documentation
COMMENT ON COLUMN organizations.deleted_at IS 'Timestamp when the organization was soft deleted (NULL if active)';
COMMENT ON COLUMN projects.deleted_at IS 'Timestamp when the project was soft deleted (NULL if active)';
COMMENT ON COLUMN brands.deleted_at IS 'Timestamp when the brand was soft deleted (NULL if active)';
