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

**Export Instructions:**

1. In Figma, open Tokens Studio plugin
2. Click on the **Settings** (⚙️) icon
3. Under **Storage**, select **Export to File**
4. Choose export format:
   - **Single File**: Exports all tokens to one JSON file (recommended for small systems)
   - **Multi File**: Exports tokens by category (primitives, semantic, themes)
5. Select export location:
   - For primitives: Export to `tokens/primitives/`
   - For semantic: Export to `tokens/semantic/`
   - For themes: Export to `tokens/themes/`
6. Ensure JSON structure uses `value` and `$type` properties
7. Create a PR or notify maintainer of changes

**Output:** Updated token JSON files in appropriate directories

**Code → Figma Flow (Recommended):**

For the best designer experience, use the optimized tokens:

1. Developer runs `npm run tokens:export-figma` after updating tokens
2. Share `dist/figma/` folder with designers (or commit to repository)
3. Designer points Token Studio to `dist/figma/` folder
4. Import - token sets automatically configured via `$themes.json`!

**Benefits:**
- ✅ Automatic scoping (radius only shows for border radius properties)
- ✅ Pre-configured theme sets
- ✅ All metadata included
- ✅ No manual Token Studio configuration needed

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
npm run tokens:validate

# Build all artifacts (grouped workflow)
npm run build
# Internally runs:
#   1. npm run build:core (validate → scale → compile)
#   2. npm run build:exports (backend → utils → figma)
#   3. npm run build:site

# Run tests to verify outputs
npm test
```

**What Gets Generated:**
- `dist/css/variables.css` - CSS custom properties (base tokens)
- `dist/css/theme-*.css` - CSS theme overrides (e.g., theme-dark.css)
- `dist/scss/_variables.scss` - SCSS variables (base tokens)
- `dist/scss/theme-*.scss` - SCSS theme maps (e.g., $theme-dark)
- `dist/js/tokens.js` - CommonJS module
- `dist/js/tokens.mjs` - ES Module
- `dist/js/tokens.d.ts` - TypeScript definitions
- `dist/json/tokens.json` - Raw JSON (nested structure)
- `dist/json/token-names.json` - Flat array of valid token keys (for backend validation)
- `dist/json/token-values.json` - Flat object of token values (for backend rendering)
- `dist/figma/` - Figma Token Studio optimized tokens with scoping and $themes.json
- `dist/utilities.css` - Utility classes
- `docs/index.html` - Visual documentation site

**Build Scripts (Running Automatically):**

*Core Pipeline (`build:core`):*
- `tokens:validate` - Validates token structure and references
- `tokens:scale` - Generates modular typography scale from configured ratio
- `tokens:compile` - Builds CSS, SCSS, JS, JSON from Style Dictionary

*Export Pipeline (`build:exports`):*
- `tokens:export-backend` - Generates flattened JSON for backend validation/rendering
- `tokens:export-utils` - Creates utility CSS classes
- `tokens:export-figma` - Optimizes tokens for Figma Token Studio with scoping metadata

*Site Pipeline (`build:site`):*
- `site:build` - Builds visual documentation site with Vite

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

**Backend (Node.js/Python/etc.):**
```javascript
// Validate user input against valid token names
const validTokens = require('@your-org/kami-design-tokens/dist/json/token-names.json');

function validateToken(tokenName) {
  if (!validTokens.includes(tokenName)) {
    throw new Error(`Invalid token: ${tokenName}`);
  }
  return true;
}

// Example: API endpoint validation
app.post('/theme', (req, res) => {
  const { primaryColor } = req.body;
  
  if (validateToken(primaryColor)) {
    res.json({ success: true });
  }
});
```

```javascript
// Render tokens server-side (PDFs, emails, etc.)
const tokenValues = require('@your-org/kami-design-tokens/dist/json/token-values.json');

function getTokenValue(tokenPath) {
  return tokenValues[tokenPath];
}

// Example: Generate inline styles for email
const emailStyles = `
  background-color: ${getTokenValue('bg.surface')};
  color: ${getTokenValue('text.primary')};
  padding: ${getTokenValue('spacing.4')};
`;

// Example: PDF generation
const primaryColor = getTokenValue('action.primary-bg'); // "#2B4D86"
```

**Backend Artifacts:**
- `dist/json/token-names.json` - Array of valid token keys for validation
- `dist/json/token-values.json` - Flat object mapping keys to resolved values

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

- [ ] Run `npm run tokens:validate` - No errors
- [ ] Run `npm run build` - Successful build
- [ ] Run `npm test` - All tests pass
- [ ] Review `docs/index.html` - Visual verification
- [ ] Verify `dist/figma/` has updated tokens and $themes.json
- [ ] Update `CHANGELOG.md` - Document changes
- [ ] Bump version with `npm version [patch|minor|major]`
- [ ] Push with tags: `git push origin main --tags`
- [ ] Verify GitHub Pages deployment
- [ ] Notify consuming teams of new version

### Theme Management

**Adding a New Theme:**

1. Create a new theme file in `tokens/themes/`:
   ```bash
   # Example: high-contrast.json
   touch tokens/themes/high-contrast.json
   ```

2. Define token overrides:
   ```json
   {
     "bg": {
       "body": { "value": "{color.black}", "$type": "color" },
       "surface": { "value": "{color.neutral.950}", "$type": "color" }
     },
     "text": {
       "primary": { "value": "{color.white}", "$type": "color" }
     },
     "border": {
       "default": { "value": "{color.neutral.300}", "$type": "color" }
     }
   }
   ```

3. Build tokens:
   ```bash
   npm run build
   ```

**What Gets Generated:**
- `dist/css/theme-high-contrast.css` - CSS theme overrides with selector `[data-theme="high-contrast"]`
- `dist/scss/theme-high-contrast.scss` - SCSS theme map `$theme-high-contrast`
- `dist/json/theme-high-contrast.json` - JSON theme tokens
- Updated `dist/figma/$themes.json` - Includes new theme configuration

**Using Themes in Applications:**

CSS:
```html
<body data-theme="high-contrast">
  <link rel="stylesheet" href="dist/css/variables.css">
  <link rel="stylesheet" href="dist/css/theme-high-contrast.css">
</body>
```

JavaScript:
```javascript
// Toggle theme
document.body.setAttribute('data-theme', 'high-contrast');

// Load theme tokens
import highContrastTheme from '@your-org/kami-design-tokens/json/theme-high-contrast.json';
```

### Typography Configuration

The typography system has two layers optimized for different use cases:

**1. Fixed UI Sizes (`font.size.basic.*`)**
- Purpose: Stable sizes for UI components
- Range: 12px - 72px (xs to 7xl)
- Use for: Buttons, form inputs, navigation, labels
- Location: `tokens/primitives/typography.json`

**2. Modular Scale (`font.size.scale.*`)**
- Purpose: Harmonious content hierarchy
- Generated: Dynamically from configurable ratio
- Use for: Headings (H1-H6), display text, hero sections
- Location: Auto-generated by script

**Changing the Modular Scale Ratio:**

1. Edit `tokens/semantic/typography.json`:
   ```json
   {
     "typography": {
       "config": {
         "scale-ratio": {
           "value": "{scale.golden}",
           "$type": "other",
           "$description": "Change to any ratio from scale.json"
         }
       }
     }
   }
   ```

2. Available ratios (in `tokens/primitives/scale.json`):
   - `{scale.major-third}` - 1.25 (default, moderate contrast)
   - `{scale.perfect-fourth}` - 1.333 (balanced)
   - `{scale.golden}` - 1.618 (dramatic scaling)
   - `{scale.major-second}` - 1.125 (subtle)

3. Rebuild tokens:
   ```bash
   npm run build
   ```

**Result:** All heading sizes automatically recalculate! UI component sizes remain unchanged.

**Example Output:**
- With Major Third (1.25): H1 = 61px, H2 = 49px, H3 = 39px
- With Golden Ratio (1.618): H1 = 107px, H2 = 66px, H3 = 41px

**Semantic Mappings:**
- `typography.ui.text.body` → `font.size.basic.base` (16px, never changes)
- `typography.heading.h1` → `font.size.scale.6` (recalculates with ratio)

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
npm run build              # Build everything (grouped: core → exports → site)
npm run build:core         # Core pipeline (validate → scale → compile)
npm run build:exports      # Export pipeline (backend → utils → figma)
npm run build:site         # Site build only
npm run tokens:compile     # Build tokens only (CSS, SCSS, JS, JSON)
npm run tokens:validate    # Check token structure and references
npm run tokens:scale       # Generate modular typography scale
npm run tokens:test        # Run build output tests
npm run tokens:export-backend   # Build backend artifacts
npm run tokens:export-figma     # Build Figma-optimized tokens
npm run tokens:export-utils     # Generate utility classes
npm run site:build         # Build documentation site
npm run site:serve         # Preview production build locally
npm test                   # Run all tests
npm run clean              # Clean dist/ and docs/ folders
npm run pack:dry           # Preview package contents
npm run tasks:archive      # Archive completed task files
```

### Important Files

- `tokens/primitives/` - Raw token values (colors, spacing, typography, etc.)
- `tokens/semantic/` - Usage-based tokens (semantic colors, typography config)
- `tokens/themes/` - Theme overrides (dark.json, etc.)
- `dist/` - Generated artifacts (not in Git)
  - `dist/css/` - CSS variables and theme files
  - `dist/scss/` - SCSS variables and theme maps
  - `dist/json/` - JSON tokens and backend artifacts
  - `dist/figma/` - Figma Token Studio optimized tokens
- `docs/` - Visual documentation site (GitHub Pages)
- `scripts/` - Build and utility scripts
- `style-dictionary.config.js` - Build configuration

### Links

- **Repository:** https://github.com/kamishino/design-tokens
- **Documentation:** https://kamishino.github.io/design-tokens/
- **Issues:** https://github.com/kamishino/design-tokens/issues

---

## Version History

- **v1.0.0** - Initial release with Style Dictionary integration
- See [CHANGELOG.md](./CHANGELOG.md) for detailed version history
