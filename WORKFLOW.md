# Design Tokens Workflow: Figma to Code

This document outlines the end-to-end process for managing design tokens from Figma through to deployed applications.

## Overview

```
Figma Design → Token Export → Git Sync → Build Process → NPM Package → Consumer Apps
```

## Table of Contents
1. [Roles & Responsibilities](#roles--responsibilities)
2. [The Workflow](#the-workflow)
3. [For Designers](#for-designers)
4. [For Maintainers](#for-maintainers)
5. [For Developers](#for-developers)
6. [Troubleshooting](#troubleshooting)

---

## Roles & Responsibilities

### Designer
- Maintains design tokens in Figma using Tokens Studio plugin
- Proposes token changes and updates
- Verifies token accuracy in the generated documentation site

### Maintainer (Design Ops / Lead Developer)
- Reviews and approves token changes
- Runs sync and build processes
- Manages versioning and releases
- Deploys documentation site

### Developer (Consumer)
- Integrates design tokens into applications
- Updates token package versions
- Reports issues with token values or structure

---

## The Workflow

### Step 1: Designer Updates Figma 🎨

**Tool:** Figma + Tokens Studio Plugin

1. Designer opens the Figma file containing the design system
2. Uses Tokens Studio plugin to manage design tokens
3. Updates or adds new token values (colors, spacing, typography, etc.)
4. Exports tokens as JSON files following W3C DTCG format
5. Creates a PR or notifies maintainer of changes

**Output:** Updated token JSON files

---

### Step 2: Sync Tokens to Repository 🔄

**Tool:** Git

**Manual Process (Current):**
```bash
# In the design-tokens repository
cd d:/Tools/design-tokens

# Update token files in tokens/primitives/ and tokens/semantic/
# Copy exported JSON files from Figma to appropriate directories

# Stage changes
git add tokens/

# Commit with descriptive message
git commit -m "feat: update primary color palette"
```

**Future Enhancement:** Automated sync script that pulls from Figma API

---

### Step 3: Build & Validate 🔨

**Tool:** NPM Scripts

```bash
# Validate token structure and references
npm run validate

# Build all artifacts (CSS, SCSS, JS, JSON, utilities, preview)
npm run build

# Run tests to verify outputs
npm test
```

**What Gets Generated:**
- `dist/css/variables.css` - CSS custom properties
- `dist/scss/_variables.scss` - SCSS variables
- `dist/js/tokens.js` - CommonJS module
- `dist/js/tokens.mjs` - ES Module
- `dist/js/tokens.d.ts` - TypeScript definitions
- `dist/json/tokens.json` - Raw JSON
- `dist/utilities.css` - Utility classes
- `docs/index.html` - Visual documentation site

**Validation Checks:**
- ✅ No broken token references
- ✅ Valid color formats
- ✅ No placeholder values (e.g., `{TODO}`)
- ✅ Proper token structure

---

### Step 4: Review Documentation Site 📖

**Tool:** Browser

```bash
# Open the generated preview site locally
start docs/index.html  # Windows
open docs/index.html   # macOS
xdg-open docs/index.html  # Linux
```

**Designer Review Checklist:**
- [ ] All colors match Figma designs
- [ ] Typography specimens look correct
- [ ] Spacing values are accurate
- [ ] Component examples render properly

---

### Step 5: Version & Release 📦

**Tool:** Git + NPM

```bash
# Update version following semantic versioning
# MAJOR: Breaking changes (e.g., token removal)
# MINOR: New tokens (backward compatible)
# PATCH: Bug fixes, value updates

npm version patch  # or minor, major

# Push changes and tags
git push origin main --tags

# Publish to NPM (if using NPM registry)
npm publish

# Or just push to Git (for Git URL installation)
git push origin main
```

**GitHub Actions (Automatic):**
- Builds tokens on push to main
- Runs validation and tests
- (Optional) Deploys docs to GitHub Pages
- (Optional) Publishes to NPM registry

---

### Step 6: Deploy Documentation (GitHub Pages) 🚀

**Manual Setup (One-time):**

1. Go to repository Settings → Pages
2. Set Source to "Deploy from branch"
3. Select branch: `main`
4. Select folder: `/docs`
5. Save

**URL:** `https://kamishino.github.io/design-tokens/`

After each push to main with documentation changes, GitHub automatically deploys the updated site.

---

### Step 7: Consumer Integration 💻

**For Developers Using the Tokens:**

#### Install/Update Package

**Via Git URL:**
```bash
npm install git+ssh://git@github.com:kamishino/design-tokens.git
# or update to latest
npm update @your-org/kami-design-tokens
```

**Via NPM (if published):**
```bash
npm install @your-org/kami-design-tokens@latest
```

#### Import in Your Application

**CSS:**
```css
/* In your global CSS file */
@import '@your-org/kami-design-tokens/css';

.my-button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
}
```

**SCSS:**
```scss
// In your SCSS file
@import '@your-org/kami-design-tokens/scss/variables';

.my-button {
  background-color: $color-primary;
  padding: $spacing-md;
}
```

**JavaScript/TypeScript:**
```typescript
import tokens from '@your-org/kami-design-tokens';

// Full type safety
const primaryColor = tokens.color.primary;
const buttonPadding = tokens.button['padding-x'];
```

**Utility Classes:**
```html
<!-- Import utilities CSS -->
<link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/utilities.css">

<!-- Use utility classes -->
<div class="bg-primary text-white p-md rounded-button">
  Hello World
</div>
```

---

## For Designers

### Making Token Changes

1. **Propose Changes**
   - Update tokens in Figma Tokens Studio
   - Document the reason for changes
   - Export updated JSON files

2. **Submit for Review**
   - Share exported files with maintainer
   - Or create a pull request with token updates

3. **Verify Changes**
   - After build, check the documentation site
   - Ensure visual appearance matches Figma

### Token Naming Conventions

**Primitives** (Raw values):
- `color.blue.500` - Color scales with numeric values
- `spacing.md` - Size scales (xs, sm, md, lg, xl)
- `fontSize.base` - Named scales

**Semantic** (Usage-based):
- `color.primary` - Intent-based naming
- `color.text-secondary` - Component or context naming
- `button.padding-x` - Component-specific tokens

---

## For Maintainers

### Daily Workflow

```bash
# Pull latest changes
git pull origin main

# If tokens updated, rebuild
npm run build

# Review changes
git diff

# If everything looks good, commit and push
git add .
git commit -m "chore: rebuild tokens"
git push origin main
```

### Release Checklist

- [ ] Run `npm run validate` - No errors
- [ ] Run `npm run build` - Successful build
- [ ] Run `npm test` - All tests pass
- [ ] Review `docs/index.html` - Visual verification
- [ ] Update `CHANGELOG.md` - Document changes
- [ ] Bump version with `npm version [patch|minor|major]`
- [ ] Push with tags: `git push origin main --tags`
- [ ] Verify GitHub Pages deployment
- [ ] Notify consuming teams of new version

---

## For Developers

### Updating Tokens in Your App

```bash
# Check current version
npm list @your-org/kami-design-tokens

# Update to latest
npm update @your-org/kami-design-tokens

# Or install specific version
npm install @your-org/kami-design-tokens@1.2.0
```

### Breaking Changes

When a **major version** is released:
1. Read the CHANGELOG for breaking changes
2. Search your codebase for deprecated token names
3. Update references to new token names
4. Test thoroughly before deploying

### Reporting Issues

If you find incorrect token values:
1. Check the live documentation site first
2. Open an issue on GitHub with:
   - Token name
   - Expected value
   - Actual value
   - Screenshot if applicable

---

## Troubleshooting

### Build Fails with Validation Errors

**Problem:** `npm run build` fails with validation errors

**Solution:**
```bash
# Run validation separately to see details
npm run validate

# Common issues:
# - Broken references: Check that referenced tokens exist
# - Invalid colors: Ensure hex codes are valid
# - Placeholder values: Remove {TODO} markers
```

### Documentation Site Shows Wrong Values

**Problem:** Preview site doesn't match expected tokens

**Solution:**
```bash
# Rebuild everything from scratch
npm run clean
npm run build

# Check that variables.css was copied to docs/
ls docs/variables.css
```

### TypeScript Types Not Working

**Problem:** IDE doesn't show autocomplete for tokens

**Solution:**
1. Ensure `dist/js/tokens.d.ts` exists
2. Restart TypeScript server in IDE
3. Check that package.json `types` field points correctly
4. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### GitHub Pages Not Updating

**Problem:** Documentation site shows old version

**Solution:**
1. Check GitHub Actions workflow ran successfully
2. Verify `docs/` folder is committed to main branch
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check GitHub Pages settings in repository

---

## Quick Reference

### Common Commands

```bash
npm run build         # Build everything
npm run validate      # Check token structure
npm test              # Run tests
npm run clean         # Clean dist/ folder
npm run pack:dry      # Preview package contents
```

### Important Files

- `tokens/primitives/` - Raw token values
- `tokens/semantic/` - Usage-based tokens
- `dist/` - Generated artifacts (not in Git)
- `docs/` - Visual documentation site
- `style-dictionary.config.js` - Build configuration

### Links

- **Repository:** https://github.com/kamishino/design-tokens
- **Documentation:** https://kamishino.github.io/design-tokens/
- **Issues:** https://github.com/kamishino/design-tokens/issues

---

## Version History

- **v1.0.0** - Initial release with Style Dictionary integration
- See [CHANGELOG.md](./CHANGELOG.md) for detailed version history
