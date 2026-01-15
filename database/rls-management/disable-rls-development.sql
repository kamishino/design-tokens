-- =====================================================
-- RLS Management: Disable for Development
-- =====================================================
-- Purpose: Disable Row Level Security for development environment
-- Usage: Run this in Supabase SQL Editor when VITE_DEV_AUTH_BYPASS=true
-- =====================================================

-- Disable RLS on all multi-project tables
DO $$
BEGIN
    -- Organizations table
    ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled for: organizations';
    
    -- Projects table  
    ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled for: projects';
    
    -- Brands table
    ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled for: brands';
    
    -- User roles table
    ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled for: user_roles';
    
    RAISE NOTICE '=== RLS DISABLED FOR DEVELOPMENT ===';
END $$;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 SECURED' 
        ELSE '🔓 OPEN' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'projects', 'brands', 'user_roles')
ORDER BY tablename;

-- =====================================================
-- Expected Output:
-- tablename     | rls_enabled | status
-- ------------- | ----------- | ------
-- brands       | false       | 🔓 OPEN
-- organizations| false       | 🔓 OPEN  
-- projects     | false       | 🔓 OPEN
-- user_roles   | false       | 🔓 OPEN
-- =====================================================
