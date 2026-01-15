# RLS Management Scripts

This folder contains SQL scripts to manage Row Level Security (RLS) for the design tokens application.

## 📁 Files

| File                            | Purpose                                            | When to Use                                        |
| ------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `verify-environment-safety.sql` | ⭐ **CRITICAL** - Verify environment before changes | **ALWAYS run first**                               |
| `disable-rls-development.sql`   | Disable RLS for development                        | Local development with `VITE_DEV_AUTH_BYPASS=true` |
| `enable-rls-production.sql`     | Enable RLS for production                          | Deploying to production environment                |
| `check-rls-status.sql`          | Check current RLS status                           | Anytime to verify RLS state                        |

## 🚀 Quick Start

### ⚠️ STEP 1: Verify Environment Safety (CRITICAL)

**Before making ANY changes, run:**
```sql
-- Run this FIRST to ensure you're not in production
verify-environment-safety.sql
```

**Look for these indicators:**
- 🔒 ALL tables have RLS enabled → **PRODUCTION** - DO NOT disable RLS!
- 🔓 ALL tables have RLS disabled → **DEVELOPMENT** - Safe to proceed
- ⚠️ MIXED configuration → Review carefully

### For Development (Fixes 500 Errors)

1. **Open Supabase SQL Editor**
2. **Run**: `verify-environment-safety.sql` (CONFIRM development mode)
3. **Run**: `disable-rls-development.sql`
4. **Result**: Mock user can create projects without RLS violations

### For Production

1. **Before deploying**: Run `enable-rls-production.sql`
2. **Result**: All tables secured with RLS policies

### Check Status

1. **Run**: `check-rls-status.sql`
2. **See**: Current RLS state for all tables

## 📊 Status Indicators

| Icon      | Meaning      | Environment |
| --------- | ------------ | ----------- |
| 🔒 SECURED | RLS Enabled  | Production  |
| 🔓 OPEN    | RLS Disabled | Development |

## 🎯 Common Use Cases

### Fixing "Row-Level Security Policy" Errors

When you see this error in development:
```
Error creating project: {
  code: '42501',
  message: 'new row violates row-level security policy for table "projects"'
}
```

**Solution**: Run `disable-rls-development.sql`

### Before Production Deployment

**Always run** `enable-rls-production.sql` to ensure:
- All tables are secured
- RLS policies are active
- Production security is maintained

### Verifying Current State

Run `check-rls-status.sql` to see:
- Which tables have RLS enabled/disabled
- Current mode (Development/Production)
- Table sizes and row counts

## 🔧 Environment Variables

The RLS behavior is controlled by:

```bash
# Development mode (disables auth checks)
VITE_DEV_AUTH_BYPASS=true

# Production mode (enables auth checks)  
VITE_DEV_AUTH_BYPASS=false
```

## 📋 Tables Managed

- `organizations` - Multi-project organizations
- `projects` - Projects within organizations  
- `brands` - Brands within projects
- `user_roles` - User role assignments

## ⚠️ Important Notes

- **Development Only**: RLS should be disabled only in development
- **Production Security**: Always enable RLS before deploying
- **Mock User**: Uses UUID `00000000-0000-0000-0000-000000000000`
- **Environment Safety**: Scripts are safe to run multiple times

## 🐛 Troubleshooting

### Still Getting RLS Errors?

1. **Check status**: Run `check-rls-status.sql`
2. **Verify environment**: Ensure `VITE_DEV_AUTH_BYPASS=true`
3. **Restart server**: After changing RLS, restart the dev server
4. **Clear cache**: Refresh browser to clear auth cache

### Scripts Not Working?

1. **Permissions**: Ensure you have admin rights in Supabase
2. **Table existence**: Verify tables exist before running scripts
3. **SQL syntax**: Copy entire script content, not partial

## 🔄 Workflow

```bash
# Development Setup
npm run dev                    # Starts with RLS errors
# → Run disable-rls-development.sql in Supabase
# → Restart dev server
# → Projects can be created successfully

# Production Deployment  
# → Run enable-rls-production.sql in Supabase
# → Deploy to production
# → RLS protects all data
```

## 📞 Support

For issues with RLS management:
1. Check the [troubleshooting section](#-troubleshooting)
2. Verify environment variables
3. Run status check script
4. Review Supabase RLS documentation
