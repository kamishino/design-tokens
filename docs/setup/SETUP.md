# 🚀 Setup Guide: Infrastructure & Project Scaffolding

This guide walks you through setting up a new design token project from scratch, including Supabase collaboration features and local development environment.

**Estimated Time:** 10-15 minutes

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Automated Project Scaffolding](#automated-project-scaffolding)
4. [Supabase Backend Setup](#supabase-backend-setup)
5. [Environment Configuration](#environment-configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v18+ installed
- **npm** v9+ installed
- **Git** configured
- A **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- Basic familiarity with terminal/command line

---

## Quick Start

For the impatient:

```bash
# 1. Clone or scaffold a new project
npm run project:clone

# 2. Install dependencies
npm install

# 3. Set up Supabase (see Supabase section below)
# 4. Configure .env file (see Environment Configuration below)

# 5. Start development
npm run dev
```

---

## Automated Project Scaffolding

The `project:clone` command automates the creation of a new design token repository for a specific client or brand.

### Running the Scaffolding Script

```bash
npm run project:clone
```

### Interactive Prompts

The script will ask you for:

1. **Project Name** - e.g., "Acme Corp Design Tokens"
2. **GitHub Repository URL** - e.g., `https://github.com/acme/design-tokens`
3. **Output Directory** - Where to create the new project (default: `../[project-name]`)

### What Gets Created

```
new-project/
├── tokens/              # Design token JSON files
│   ├── primitives/
│   ├── semantic/
│   └── themes/
├── dist/                # Generated artifacts (CSS, SCSS, JS)
├── scripts/             # Build and utility scripts
├── site/                # Token management dashboard
├── .env.example         # Environment template
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

### Post-Scaffolding Steps

After scaffolding:

1. Navigate to the new directory: `cd ../new-project`
2. Install dependencies: `npm install`
3. Continue with Supabase setup below

---

## Supabase Backend Setup

Supabase enables multi-project collaboration and sandbox editing. **This is optional** - the app works in local-only mode without it.

### Step 1: Create a Supabase Project

1. Visit [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: e.g., "Design Tokens Hub"
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your team
5. Wait ~2 minutes for provisioning

### Step 2: Get Your Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (long JWT token starting with `eyJ...`)

### Step 3: Run the Database Schema

#### 🎯 Quickstart: One-Click Setup

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the schema below
5. Click **"Run"** or press `Ctrl+Enter`

#### 📋 Database Schema

```sql
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

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_drafts ENABLE ROW LEVEL SECURITY;

-- Development policies: Allow all operations
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all on token_drafts" ON token_drafts FOR ALL USING (true);

-- For production, replace with proper auth policies
```

#### ✅ Verification

After running the schema, verify in Supabase:

1. Go to **Table Editor** (left sidebar)
2. You should see two tables:
   - `projects`
   - `token_drafts`

---

## Environment Configuration

### Step 1: Create Your `.env` File

```bash
# Copy the example file
cp .env.example .env
```

### Step 2: Add Your Supabase Credentials

Open `.env` and replace the placeholder values:

```bash
# Supabase Configuration (Optional - for multi-project collaboration features)
# If not set, the app will run in local-only mode

# Your Supabase Project URL (from Settings → API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase Anon/Public Key (from Settings → API)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Restart Your Dev Server

**Important:** Vite only reads `.env` at startup. After creating or modifying `.env`, you must restart:

```bash
# Stop the server (Ctrl+C)
# Then start again:
npm run dev
```

---

## Verification

### Test Supabase Connection

Run the built-in connection test:

```bash
npm run test:supabase
```

**Expected output:**
```
✓ Environment variables found
✓ URL is valid: https://your-project.supabase.co
✓ Supabase client created
✓ Database connection successful!
✨ Connection Test Complete
```

### Verify the Dashboard

1. Open `http://localhost:5173/design-tokens/` in your browser
2. Open DevTools Console (F12)
3. Look for:
   ```
   [Supabase Debug] URL: ✓ Loaded
   [Supabase Debug] Key: ✓ Loaded
   ```
4. You should see the **App Top Bar** at the top of the page

---

## Troubleshooting

### "Top Bar not appearing"

**Symptom:** Dashboard loads but no top bar with Project Switcher and Sandbox Toggle.

**Causes:**
1. `.env` file not in project root directory
2. Environment variables not loaded by Vite
3. Invalid Supabase credentials

**Solutions:**
1. Ensure `.env` is in the same directory as `package.json`
2. Restart dev server: `npm run dev`
3. Check browser console for `[Supabase Debug]` messages
4. Run `npm run test:supabase` to verify connection

### "Environment variables not loaded"

**Symptom:** Console shows `[Supabase Debug] URL: ✗ Missing`

**Solution:**
1. Verify `.env` file exists in project root
2. Check variables start with `VITE_` prefix (required by Vite)
3. Ensure no extra spaces around `=` in `.env` file
4. Restart dev server completely (stop and start, not just refresh browser)

### "Database connection error"

**Symptom:** `npm run test:supabase` fails with connection errors

**Solutions:**
1. Verify Supabase project is active (not paused)
2. Check URL format: `https://[project-id].supabase.co` (no trailing slash)
3. Verify anon key is correct (should be a long JWT token)
4. Check firewall/network isn't blocking Supabase

### "Tables don't exist"

**Symptom:** Connection succeeds but "projects table doesn't exist"

**Solution:**
1. Go to Supabase SQL Editor
2. Run the database schema again (see [Step 3: Run the Database Schema](#step-3-run-the-database-schema))
3. Verify in Table Editor that tables were created

---

## Next Steps

Once setup is complete:

1. **Configure Figma Sync** - See [User Guide](../user/GUIDE.md) for Token Studio setup
2. **Start Developing** - Run `npm run dev` and open the dashboard
3. **Explore Features** - Toggle Sandbox Mode, create tokens, publish changes

For daily workflow and usage instructions, see **[User Guide](../user/GUIDE.md)**.
