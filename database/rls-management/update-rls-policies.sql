-- =====================================================
-- RLS Management: Update Policies for Mock User
-- =====================================================
-- Purpose: Add RLS policies that allow mock user in development
-- Usage: When you want to keep RLS enabled but allow mock user
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow mock user in dev" ON organizations;
DROP POLICY IF EXISTS "Allow mock user in dev" ON projects;
DROP POLICY IF EXISTS "Allow mock user in dev" ON brands;
DROP POLICY IF EXISTS "Allow mock user in dev" ON user_roles;

-- Create policies that allow mock user in development
CREATE POLICY "Allow mock user in dev" ON organizations
FOR ALL USING (
  auth.uid() = '00000000-0000-0000-0000-000000000000' OR
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow mock user in dev" ON projects
FOR ALL USING (
  auth.uid() = '00000000-0000-0000-0000-000000000000' OR
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow mock user in dev" ON brands
FOR ALL USING (
  auth.uid() = '00000000-0000-0000-0000-000000000000' OR
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow mock user in dev" ON user_roles
FOR ALL USING (
  auth.uid() = '00000000-0000-0000-0000-000000000000' OR
  auth.role() = 'authenticated'
);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE 'Allow mock user in dev'
ORDER BY tablename, policyname;

-- =====================================================
-- Result: Mock user can access all tables while RLS remains enabled
-- Other users still need proper authentication
-- =====================================================
