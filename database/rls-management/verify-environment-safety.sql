-- =====================================================
-- Environment & RLS Safety Verification (FIXED)
-- =====================================================
-- Purpose: Verify current environment and RLS status before making changes
-- Usage: Run this FIRST to ensure you're not in production
-- =====================================================

-- 1. Environment Verification
DO $$
BEGIN
    RAISE NOTICE '=== ENVIRONMENT VERIFICATION ===';
    
    -- Check superuser access
    IF current_setting('is_superuser', true) = 'on' THEN
        RAISE NOTICE '✅ Superuser access: YES (Good for RLS management)';
    ELSE
        RAISE NOTICE '⚠️  Superuser access: NO (Limited permissions)';
    END IF;
    
    -- Check database name
    RAISE NOTICE '📊 Database: %', current_database();
    
    -- Check current user
    RAISE NOTICE '👤 Current user: %', current_user;
    
    -- Check environment variables
    BEGIN
        RAISE NOTICE '🔧 Node environment: %', current_setting('app.env', true);
    EXCEPTION WHEN undefined_object THEN
        RAISE NOTICE '🔧 Node environment: Not accessible (normal in Supabase)';
    END;
    
    RAISE NOTICE '=== END ENVIRONMENT VERIFICATION ===';
END $$;

-- 2. Current RLS Status
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT RLS STATUS ===';
END $$;

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 SECURED' 
        ELSE '🔓 OPEN' 
    END as status,
    CASE 
        WHEN rowsecurity THEN 'PRODUCTION READY'
        ELSE 'DEVELOPMENT MODE'
    END as mode,
    CASE 
        WHEN rowsecurity THEN '⚠️  Changing this affects security!'
        ELSE '✅ Safe for development'
    END as safety_note
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'projects', 'brands', 'user_roles')
ORDER BY tablename;

-- 3. Existing RLS Policies
DO $$
BEGIN
    RAISE NOTICE '=== EXISTING RLS POLICIES ===';
END $$;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has conditions'
        ELSE 'No conditions'
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'projects', 'brands', 'user_roles')
ORDER BY tablename, policyname;

-- 4. Mock User Verification
DO $$
BEGIN
    RAISE NOTICE '=== MOCK USER VERIFICATION ===';
    
    -- Check if mock user exists in auth.users
    BEGIN
        PERFORM 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
        RAISE NOTICE '👤 Mock user exists in auth.users: ✅ YES';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '👤 Mock user exists in auth.users: ❌ NO (auth.users not accessible)';
    END;
    
    -- Check if mock user exists in regular users
    BEGIN
        PERFORM 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000000';
        RAISE NOTICE '👤 Mock user exists in users table: ✅ YES';
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        RAISE NOTICE '👤 Mock user exists in users table: ❌ NO (table/column not found)';
    END;
END $$;

-- 5. Safety Recommendations
DO $$
DECLARE
    rls_count INTEGER;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== SAFETY RECOMMENDATIONS ===';
    
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('organizations', 'projects', 'brands', 'user_roles')
      AND rowsecurity = true;
    
    -- Count existing policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('organizations', 'projects', 'brands', 'user_roles');
    
    IF rls_count = 4 THEN
        RAISE NOTICE '🔒 ALL tables have RLS enabled - PRODUCTION CONFIGURATION';
        RAISE NOTICE '⚠️  WARNING: You appear to be in PRODUCTION mode!';
        RAISE NOTICE '❌ DO NOT disable RLS - this would compromise security!';
        RAISE NOTICE '💡 Instead, use create-mock-user.sql or update-rls-policies.sql';
    ELSIF rls_count = 0 THEN
        RAISE NOTICE '🔓 ALL tables have RLS disabled - DEVELOPMENT CONFIGURATION';
        RAISE NOTICE '✅ SAFE to proceed with development activities';
        RAISE NOTICE '💡 You can create projects without RLS violations';
    ELSIF rls_count > 0 AND rls_count < 4 THEN
        RAISE NOTICE '⚠️  MIXED RLS configuration - Some tables secured, some not';
        RAISE NOTICE '🔍 Review which tables need RLS adjustment';
    END IF;
    
    IF policy_count > 0 THEN
        RAISE NOTICE '📋 Found % existing RLS policies', policy_count;
        RAISE NOTICE '💡 Consider updating policies instead of disabling RLS';
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
    RAISE NOTICE '📝 Review the results above before making any changes!';
    RAISE NOTICE '🛡️  Always prioritize security in production environments!';
END $$;
