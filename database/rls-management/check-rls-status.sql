-- =====================================================
-- RLS Management: Check Current Status
-- =====================================================
-- Purpose: Check current Row Level Security status on all tables
-- Usage: Run this anytime to verify RLS state
-- =====================================================

-- Check RLS status for all relevant tables
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 SECURED' 
        ELSE '🔓 OPEN' 
    END as status,
    CASE 
        WHEN rowsecurity THEN 'Production Ready'
        ELSE 'Development Mode'
    END as mode
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'projects', 'brands', 'user_roles')
ORDER BY tablename;

-- Additional table information
SELECT 
    t.tablename,
    t.rows,
    pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename)) as size,
    t.rowsecurity as rls_enabled
FROM pg_tables t
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('organizations', 'projects', 'brands', 'user_roles')
ORDER BY t.tablename;

-- =====================================================
-- Status Legend:
-- 🔒 SECURED = RLS Enabled (Production)
-- 🔓 OPEN   = RLS Disabled (Development)
-- =====================================================
