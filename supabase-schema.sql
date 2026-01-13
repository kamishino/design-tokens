-- Supabase Database Schema for Design Token Collaboration
-- Run this in your Supabase SQL editor to set up the required tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table: Registry of design token projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  git_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token drafts table: Collaborative sandbox for token editing
CREATE TABLE IF NOT EXISTS token_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, file_path)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_drafts_project_id ON token_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_token_drafts_file_path ON token_drafts(file_path);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_token_drafts_updated_at ON token_drafts;
CREATE TRIGGER update_token_drafts_updated_at
  BEFORE UPDATE ON token_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Optional, adjust based on your auth strategy
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_drafts ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust as needed for your authentication setup)
-- For development/testing: Allow all operations
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all on token_drafts" ON token_drafts FOR ALL USING (true);

-- For production, replace with proper auth policies, e.g.:
-- CREATE POLICY "Users can read all projects" ON projects FOR SELECT USING (true);
-- CREATE POLICY "Authenticated users can insert projects" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Users can read drafts for their projects" ON token_drafts FOR SELECT USING (true);
-- CREATE POLICY "Authenticated users can upsert drafts" ON token_drafts FOR ALL USING (auth.role() = 'authenticated');

-- Sample data (optional - for testing)
-- INSERT INTO projects (name, git_url) VALUES 
--   ('Acme Design Tokens', 'https://github.com/acme/design-tokens'),
--   ('Beta Brand System', 'https://github.com/beta/tokens');
