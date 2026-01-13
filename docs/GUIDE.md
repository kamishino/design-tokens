# 📘 User Guide: Daily Workflow & Collaboration

This guide covers day-to-day usage of the Design Token Manager, including Figma sync, sandbox collaboration, and publishing workflows.

---

## Table of Contents

1. [Overview](#overview)
2. [Figma Token Studio Setup](#figma-token-studio-setup)
3. [Production vs Sandbox Mode](#production-vs-sandbox-mode)
4. [Token Editing Workflow](#token-editing-workflow)
5. [Publishing Changes](#publishing-changes)
6. [Common Commands](#common-commands)
7. [Best Practices](#best-practices)

---

## Overview

The Design Token Manager operates in two modes:

- **Production Mode** (default) - Read-only view of Git-committed tokens
- **Sandbox Mode** - Collaborative editing with Supabase-backed drafts

This dual-mode approach ensures production tokens remain stable while enabling safe experimentation and team collaboration.

---

## Figma Token Studio Setup

To sync tokens from Figma to your repository, configure the **Token Studio for Figma** plugin with the GitHub provider.

### Prerequisites

- **Token Studio** plugin installed in Figma ([Get it here](https://www.figma.com/community/plugin/843461159747178978))
- **GitHub Personal Access Token** with `repo` permissions
- Your repository URL and branch name

### Step-by-Step Configuration

#### 1. Open Token Studio in Figma

1. Open your Figma file
2. Go to **Plugins** → **Token Studio**
3. Click **Settings** (gear icon)

#### 2. Add GitHub Provider

1. In Settings, go to **Sync** tab
2. Click **Add New** under "Sync providers"
3. Select **GitHub** as the provider type

#### 3. Configure GitHub Connection

Fill in the following fields:

| Field | Value | Example |
|-------|-------|---------|
| **Name** | Friendly name for this sync | "Design Tokens - Main" |
| **Personal Access Token** | Your GitHub PAT | `ghp_abc123...` |
| **Repository** | `owner/repo` format | `acme/design-tokens` |
| **Branch** | Target branch | `main` or `tokens` |
| **File Path** | Path to tokens directory | `tokens/` |
| **Base Path** | Leave empty | |

#### 4. Configure Token Paths

In the **File Structure** section:

- **$themes.json**: `tokens/$themes.json`
- **$metadata.json**: `tokens/$metadata.json`
- **Primitives**: `tokens/primitives/`
- **Semantic**: `tokens/semantic/`
- **Themes**: `tokens/themes/`

#### 5. Test the Connection

1. Click **Save** to save your GitHub provider
2. Click **Pull** to fetch current tokens from GitHub
3. Verify tokens load correctly in Token Studio

#### 6. Enable Push Sync

1. In Token Studio, make a small test change (e.g., add a comment)
2. Click **Push** to sync changes to GitHub
3. Verify commit appears in your repository

---

## Production vs Sandbox Mode

### Understanding the Modes

#### 🔒 Production Mode (Default)

- **Data Source:** Git repository (local JSON files)
- **Editing:** **Read-only** - no edits allowed
- **Use Case:** Reviewing stable, production-ready tokens
- **Visual Indicator:** Gray "PRODUCTION" badge in top bar

#### 🧪 Sandbox Mode

- **Data Source:** Supabase (collaborative drafts)
- **Editing:** **Fully editable** - all CRUD operations enabled
- **Use Case:** Team collaboration, experimentation, staging changes
- **Visual Indicator:** Orange "SANDBOX" badge in top bar

### Switching Modes

Toggle between modes using the **Sandbox Toggle** in the App Top Bar:

1. Locate the toggle switch in the top-right of the dashboard
2. Click to switch:
   - **Production** (Git icon) → Read-only
   - **Sandbox** (Flask icon) → Editable

### What Happens When You Switch

**Entering Sandbox Mode:**
- Dashboard loads draft tokens from Supabase
- All editing features become enabled
- Draft change badge shows unpublished modifications

**Returning to Production:**
- Dashboard loads committed tokens from Git
- All editing features are disabled
- Warning shown if you have unpublished sandbox changes

---

## Token Editing Workflow

### Creating New Tokens

1. **Switch to Sandbox Mode**
2. Click **"+ Add Token"** button in the page header
3. Fill in token details:
   - **Name**: Token identifier (e.g., `color.primary.500`)
   - **Type**: Select from dropdown (color, dimension, typography, etc.)
   - **Value**: Token value (e.g., `#3b82f6`, `16px`, etc.)
4. Click **Save**

### Editing Existing Tokens

1. **Switch to Sandbox Mode**
2. Navigate to the token in the file tree
3. Click the **Edit** (pencil) icon
4. Modify values in the modal
5. Click **Save**

### Using Token References

Tokens can reference other tokens using curly brace syntax:

```json
{
  "color": {
    "blue": {
      "500": { "value": "#3b82f6", "$type": "color" }
    },
    "primary": {
      "value": "{color.blue.500}",
      "$type": "color"
    }
  }
}
```

### Deleting Tokens

1. **Switch to Sandbox Mode**
2. Locate the token in the tree
3. Click the **Delete** (trash) icon
4. Confirm deletion in the prompt

---

## Publishing Changes

Publishing merges your Sandbox drafts back into the production Git repository.

### When to Publish

Publish when:
- You've completed a logical set of changes
- Changes have been reviewed by the team
- You're ready to make tokens available to production systems

### Publishing Workflow

#### 1. Review Your Changes

- Badge in top bar shows draft change count
- Review modified tokens in Sandbox Mode
- Test changes in your application

#### 2. Click Publish Button

1. Locate **"Publish"** button in App Top Bar (only visible in Sandbox Mode)
2. Button shows change count (e.g., "Publish 5 changes")
3. Click the button

#### 3. Confirm Publication

Confirmation dialog shows:
- Number of changes to publish
- Impact summary
- Warning about irreversibility

Click **OK** to proceed or **Cancel** to abort.

#### 4. What Happens on Publish

1. Sandbox drafts are merged into local JSON files
2. Drafts are cleared from Supabase
3. Dashboard reloads with updated tokens
4. **Manual step required:** Run build to generate artifacts

#### 5. Build and Commit

After publishing, run the build pipeline:

```bash
# Generate CSS, SCSS, JS artifacts
npm run build

# Commit changes to Git
git add .
git commit -m "feat: update design tokens"
git push
```

### Post-Publish Verification

1. Check the `dist/` directory for updated artifacts:
   - `dist/css/variables.css`
   - `dist/scss/_variables.scss`
   - `dist/js/tokens.js`
2. Verify tokens in your application
3. Share with team via Git

---

## Common Commands

### Development

```bash
# Start dev server (dashboard + API)
npm run dev

# Start only the dashboard
npm run site:serve

# Start only the backend API
npm run server:dev
```

### Building Tokens

```bash
# Full build pipeline (validate + compile)
npm run build

# Validate tokens only
npm run tokens:validate

# Compile tokens to artifacts
npm run tokens:compile
```

### Testing

```bash
# Test Supabase connection
npm run test:supabase

# Run all tests (if configured)
npm test
```

### Utilities

```bash
# Clone/scaffold a new project
npm run project:clone

# Check CDN health (if using remote assets)
npm run health:cdn

# Archive completed tasks
npm run tasks:archive
```

---

## Best Practices

### Token Organization

1. **Use hierarchical naming**: `component.element.state.property`
   - ✅ `button.primary.hover.background`
   - ❌ `primaryButtonHoverBg`

2. **Separate primitives from semantic tokens**:
   - Primitives: Raw values (`color.blue.500: #3b82f6`)
   - Semantic: Contextual references (`color.primary: {color.blue.500}`)

3. **Group related tokens**: Use folder structure to organize by category

### Collaboration Workflow

1. **Always work in Sandbox Mode** for edits
2. **Communicate with team** before publishing major changes
3. **Test locally** before publishing
4. **Publish frequently** to avoid merge conflicts
5. **Document changes** in commit messages

### Token Naming Conventions

Follow your design system's naming convention. Common patterns:

- **BEM-style**: `component__element--modifier`
- **Namespace-style**: `brand.color.primary.base`
- **CSS Custom Property style**: `--color-primary-500`

### Version Control

1. **Commit built artifacts** (`dist/` folder) for CDN usage
2. **Use semantic versioning** for releases
3. **Tag releases** in Git: `git tag v1.2.0`
4. **Maintain CHANGELOG.md** for tracking changes

### Figma Sync Best Practices

1. **Pull before push**: Always sync latest tokens from GitHub before making Figma changes
2. **Single source of truth**: Decide whether Figma or code is authoritative
3. **Review diffs**: Check what changed before accepting Figma pushes
4. **Use branches**: Create a separate Git branch for experimental Figma changes

---

## Troubleshooting

### "Can't edit tokens"

**Issue:** Edit buttons are grayed out or hidden.

**Solution:** Switch to **Sandbox Mode** using the toggle in the top bar.

### "Changes not saving"

**Issue:** Edits don't persist after refresh.

**Solutions:**
1. Verify you're in Sandbox Mode
2. Check Supabase connection: `npm run test:supabase`
3. Check browser console for errors

### "Publish button missing"

**Issue:** Can't find the Publish button.

**Reasons:**
1. You're in Production Mode (switch to Sandbox)
2. No draft changes exist (make edits first)
3. Supabase not configured (button only shows when Supabase is active)

### "Build artifacts outdated"

**Issue:** CSS/SCSS files don't reflect latest token changes.

**Solution:**
```bash
npm run build
```

---

## Need Help?

- **Setup Issues**: See [SETUP.md](./SETUP.md)
- **Bug Reports**: Open an issue on GitHub
- **Feature Requests**: Discuss in GitHub Discussions

Happy token managing! 🎨
