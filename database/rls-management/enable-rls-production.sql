-- =====================================================
-- RLS Management: Enable for Production
-- =====================================================
-- Purpose: Enable Row Level Security for production environment
-- Usage: Run this in Supabase SQL Editor when deploying to production
-- =====================================================

-- Enable RLS on all multi-project tables
DO $$
BEGIN
    -- Organizations table
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled for: organizations';
    
    -- Projects table  
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled for: projects';
    
    -- Brands table
    ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled for: brands';
    
    -- User roles table
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled for: user_roles';
    
    RAISE NOTICE '=== RLS ENABLED FOR PRODUCTION ===';
END $$;

-- Verify RLS is enabled
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
-- brands       | true        | 🔒 SECURED
-- organizations| true        | 🔒 SECURED  
-- projects     | true        | 🔒 SECURED
-- user_roles   | true        | 🔒 SECURED
-- =====================================================
