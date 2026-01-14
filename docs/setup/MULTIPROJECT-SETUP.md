# 🏢 Multi-Project Setup Guide

**PRD 0051: Multi-Tenant Database Architecture**

This guide explains how to set up and use the multi-project, multi-tenant design token system with Supabase.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Setup](#database-setup)
4. [Migration from File-Based System](#migration-from-file-based-system)
5. [API Usage](#api-usage)
6. [CI/CD Configuration](#cicd-configuration)
7. [Best Practices](#best-practices)

---

## Overview

The multi-project system enables:

- **Organizations** - Top-level grouping for multiple projects
- **Projects** - Individual applications or platforms
- **Brands** - Visual variants within a project (e.g., light/dark themes)
- **3-Tier Token Inheritance** - Global → Project → Brand
- **Role-Based Access Control** - Admin, Editor, Viewer roles per project
- **Automated Builds** - GitHub Actions triggered from Supabase
- **Version Snapshots** - Track and rollback token changes

---

## Architecture

### Data Model

```
Organizations (e.g., "Acme Corp")
  └── Projects (e.g., "Customer Portal", "Admin Dashboard")
       └── Brands (e.g., "Default", "Dark Mode", "Seasonal")
            └── Tokens (with inheritance from Global → Project → Brand)
```

### Token Inheritance

Tokens are resolved in this priority order:

1. **Brand-specific tokens** (highest priority)
2. **Project-level tokens** (overrides global)
3. **Global tokens** (base defaults)

Example:
```
Global: color.primary.500 = "#3b82f6"
Project: color.primary.500 = "#10b981" (overrides global)
Brand: color.primary.500 = "#8b5cf6" (overrides project)

Result for brand: "#8b5cf6"
```

---

## Database Setup

### Step 1: Run Multi-Project Schema

1. Open Supabase SQL Editor
2. Run the enhanced schema:

```bash
# Located at: database/supabase-schema-multiproject.sql
```

This creates:
- `organizations`, `projects`, `brands` tables
- `tokens` table (individual tokens, not file-based)
- `token_versions`, `releases` tables
- `user_profiles`, `user_roles` tables
- PostgreSQL function `resolve_brand_tokens(brand_id)`
- RLS policies for all tables

### Step 2: Enable Supabase Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable:
   - Email/Password
   - Google OAuth (optional)
   - GitHub OAuth (optional)
3. Configure redirect URLs for your application

### Step 3: Configure Environment Variables

Add to `.env`:

```bash
# Existing Supabase config
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Service Role Key (required for migrations and CI/CD)
# Find this in: Supabase Dashboard → Settings → API → service_role key
# ⚠️ Keep this secret! Never commit to version control
SUPABASE_SERVICE_KEY=your-service-role-key

# For GitHub Actions automation
GITHUB_TOKEN=your-github-pat
GITHUB_REPOSITORY=owner/repo
```

**Important:** The `SUPABASE_SERVICE_KEY` is required for migration scripts because it bypasses RLS policies. Get this from your Supabase Dashboard under Settings → API → service_role key.

---

## Migration from File-Based System

### Automatic Migration Script

Migrate your existing `tokens/` directory to the database:

```bash
npm run db:migrate -- \
  --org=my-org \
  --orgName="My Organization" \
  --project=main-project \
  --projectName="Main Project" \
  --brand=default \
  --brandName="Default Theme"
```

**What it does:**
- Creates organization and project if they don't exist
- Creates default brand
- Parses all JSON files in `tokens/`
- Extracts individual tokens with paths
- Inserts into `tokens` table with brand association

### Manual SQL Migration

For existing `projects` and `token_drafts`:

```bash
# Run migration helper
# Located at: database/migration-legacy-to-multiproject.sql
```

---

## API Usage

### REST API Endpoints

All multi-project endpoints are prefixed with `/api/mp/`:

#### Organizations

```bash
# List organizations
GET /api/mp/organizations

# Create organization
POST /api/mp/organizations
{
  "name": "Acme Corporation",
  "slug": "acme"
}
```

#### Projects

```bash
# List projects in an organization
GET /api/mp/organizations/{orgId}/projects

# Create project
POST /api/mp/organizations/{orgId}/projects
{
  "name": "Customer Portal",
  "slug": "customer-portal",
  "description": "Public-facing customer portal",
  "git_url": "https://github.com/acme/portal-tokens"
}
```

#### Brands

```bash
# List brands in a project
GET /api/mp/projects/{projectId}/brands

# Create brand
POST /api/mp/projects/{projectId}/brands
{
  "name": "Dark Mode",
  "slug": "dark",
  "description": "Dark theme variant",
  "is_default": false
}
```

#### Tokens

```bash
# Get resolved tokens for a brand (with inheritance)
GET /api/mp/brands/{brandId}/tokens

# Create/update token
POST /api/mp/brands/{brandId}/tokens
{
  "token_path": "color.primary.500",
  "token_type": "color",
  "value": "#8b5cf6",
  "description": "Primary brand color"
}

# Delete token
DELETE /api/mp/brands/{brandId}/tokens/{tokenPath}
```

#### Global Tokens

```bash
# Get all global tokens
GET /api/mp/tokens/global

# Create/update global token (admin only)
POST /api/mp/tokens/global
{
  "token_path": "spacing.base",
  "token_type": "dimension",
  "value": "16px",
  "description": "Base spacing unit"
}
```

### Authentication

Include Supabase access token in requests:

```bash
Authorization: Bearer <supabase-access-token>
```

---

## CI/CD Configuration

### GitHub Actions Setup

1. Add secrets to GitHub repository:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

2. Workflow is triggered via `repository_dispatch`:

```yaml
# Already configured in: .github/workflows/build-multiproject.yml
```

### Supabase Edge Function Setup

1. Deploy the Edge Function:

```bash
# Install Supabase CLI
npm install -g supabase

# Deploy function
supabase functions deploy trigger-github-build
```

2. Set environment variables for the function:

```bash
supabase secrets set GITHUB_TOKEN=<your-github-pat>
supabase secrets set GITHUB_REPOSITORY=owner/repo
```

### Triggering a Build

Call the Edge Function to create a version and trigger build:

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/trigger-github-build \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "uuid-of-brand",
    "version_number": "1.2.0",
    "changelog": "Updated primary colors"
  }'
```

This will:
1. Create a snapshot in `token_versions`
2. Create a release record
3. Trigger GitHub Actions workflow
4. Build tokens with Style Dictionary
5. Upload to Supabase Storage as CDN

---

## Best Practices

### Organization Structure

```
Organization: "Acme Corp"
├── Project: "Web Platform"
│   ├── Brand: "Default" (light theme)
│   ├── Brand: "Dark Mode"
│   └── Brand: "High Contrast"
├── Project: "Mobile App"
│   ├── Brand: "iOS Theme"
│   └── Brand: "Android Theme"
└── Project: "Marketing Site"
    └── Brand: "Default"
```

### Token Organization

- **Global tokens**: Foundation colors, typography scale, spacing
- **Project tokens**: Component-specific values, layout tokens
- **Brand tokens**: Theme-specific overrides, brand colors

### Access Control

- **Admin**: Full control over project, manage team members
- **Editor**: Create/edit/delete tokens, trigger builds
- **Viewer**: Read-only access to tokens

### Versioning Strategy

Use semantic versioning for releases:

- **Major (1.0.0)**: Breaking changes
- **Minor (1.1.0)**: New tokens added
- **Patch (1.1.1)**: Token value updates

---

## Troubleshooting

### "Multi-project mode not available"

**Cause:** Supabase not configured or credentials missing

**Solution:**
1. Verify `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Restart server: `npm run dev`

### "Insufficient permissions"

**Cause:** User doesn't have required role for the project

**Solution:**
1. Check user roles: `SELECT * FROM user_roles WHERE user_id = 'your-user-id'`
2. Admin must grant role via API or SQL

### Edge Function fails to trigger build

**Cause:** Missing GitHub token or repository name

**Solution:**
1. Verify Edge Function secrets: `supabase secrets list`
2. Check GitHub token has `repo` scope
3. Review Edge Function logs in Supabase Dashboard

### "new row violates row-level security policy"

**Cause:** Migration script using anon key instead of service key

**Solution:**
1. Add `SUPABASE_SERVICE_KEY` to `.env` file
2. Get service key from: Supabase Dashboard → Settings → API → service_role
3. This key bypasses RLS policies and is required for migrations
4. ⚠️ **Never commit service key to Git!**

---

## Next Steps

- **Frontend Integration**: Build UI components for org/project/brand switching
- **Token Editor**: Update to work with database instead of files
- **Version History UI**: Display snapshots and allow rollback
- **Team Management**: Admin interface for managing user roles

For questions or issues, see [GitHub Issues](https://github.com/your-org/design-tokens/issues).
