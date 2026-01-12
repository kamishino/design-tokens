# 🎨 Kami Design Tokens

> Centralized design tokens repository - Single Source of Truth for design values across all platforms

[![Version](https://img.shields.io/npm/v/@your-org/kami-design-tokens.svg)](https://www.npmjs.com/package/@your-org/kami-design-tokens)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This repository serves as the Single Source of Truth (SSOT) for all design tokens used across the Kami platform. It syncs with Figma and distributes versioned artifacts to Frontend, Backend, and Mobile applications.

## Features

- 🔄 **Figma Sync**: Automated synchronization with Figma Token Studio
- 🎯 **Multi-Platform**: Generate tokens for Web (CSS, SCSS, JS) and Backend (JSON)
- 📦 **Versioned**: Semantic versioning for design updates
- 🚀 **Automated CI/CD**: GitHub Actions for build and release
- 🔧 **Type-Safe**: TypeScript definitions included
- **Organized Output**: CSS grouped by category with headers, JSON alphabetically sorted
- **Dot-Free Naming**: Enforced hyphenated naming for fractional values (e.g., `0-5` instead of `0.5`)

## Figma Integration (Token Studio)

This repository is optimized for **Figma Token Studio** with automated token enrichment and configuration generation.

### Quick Start for Designers

1. **Clone or download** the repository
2. In Figma, open **Token Studio** plugin
3. **Settings** → **Add new** → **Local folder**
4. Point to `dist/figma/` directory
5. **Import** - all token sets will be automatically configured!

### What's Included

**Token Sets** (auto-configured in `$themes.json`):

- ✅ `primitives/colors` - Base color palette with `color` scope
- ✅ `primitives/radius` - Border radius values with `borderRadius` scope
- ✅ `primitives/spacing` - Spacing scale with `spacing` scope
- ✅ `primitives/typography` - Font sizes with `fontSizes` scope
- ✅ `semantic/*` - Semantic tokens mapped to UI roles
- ✅ `themes/*` - Theme overrides (dark mode, etc.)

**Scoping** (automatic):

- **Radius variables** only appear when editing border radius properties
- **Spacing variables** only appear when editing gaps, padding, margins
- **Color variables** only appear when editing color properties

### Building for Figma

```bash
# Generate optimized tokens
npm run tokens:export-figma

# Output: dist/figma/ with enriched tokens and $themes.json
```

**Code → Figma Workflow**:

1. Update tokens in `tokens/` directory
2. Run `npm run tokens:export-figma`
3. Designers sync in Token Studio
4. Tokens automatically scoped and configured

## CI/CD Pipeline

The repository includes a GitHub Actions workflow that automatically:

- ✅ **Validates tokens** against schema on every push and PR
- ✅ **Builds all artifacts** (CSS, SCSS, JS, JSON, utilities, preview site)
- ✅ **Runs tests** to verify output integrity
- ✅ **Deploys documentation** to GitHub Pages on push to `main` or release tags
- ✅ **Uploads dist artifacts** for download and verification
- 🚧 **NPM publishing** (commented out, ready to enable)

**Quality Gates**: The build will fail if:

- Token files don't pass schema validation
- References point to non-existent tokens
- Test suite fails

**Live Documentation**: Preview site is automatically deployed to GitHub Pages at `https://[your-org].github.io/design-tokens/`

## Installation

### Via Git URL (Recommended for private repos)

```bash
npm install git+ssh://git@github.com:your-org/kami-design-tokens.git
```

### Via NPM (if published)

```bash
npm install @your-org/kami-design-tokens
```

## Usage

### CSS Variables

```css
/* Import in your CSS */
@import "@your-org/kami-design-tokens/css";

/* Use tokens */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
}
```

### SCSS Variables

```scss
// Import in your SCSS
@import "@your-org/kami-design-tokens/scss/variables";

// Use tokens
.button {
  background-color: $color-primary;
  padding: $spacing-md;
}
```

### JavaScript/TypeScript

```javascript
// ES Modules
import tokens from "@your-org/kami-design-tokens";

// Use tokens with full autocomplete
const primaryColor = tokens.color.primary;
const spacing = tokens.spacing.md;
```

#### TypeScript with Strict Types

```typescript
// Full type safety and IDE autocomplete
import tokens from "@your-org/kami-design-tokens";

// TypeScript knows the exact structure
const buttonPadding: string = tokens.button["padding-x"];
const primaryColor: string = tokens.color.primary;

// Compile-time error if token doesn't exist
// const invalid = tokens.nonExistent.token; // ❌ TypeScript error
```

### Backend JSON

**For Validation:**

```javascript
// Node.js - Validate user input against valid token names
const validTokens = require("@your-org/kami-design-tokens/dist/json/token-names.json");

function validateToken(tokenName) {
  if (!validTokens.includes(tokenName)) {
    throw new Error(`Invalid token: ${tokenName}`);
  }
  return true;
}

// API endpoint validation
app.post("/theme", (req, res) => {
  const { primaryColor } = req.body;

  if (validateToken(primaryColor)) {
    res.json({ success: true });
  }
});
```

**For Server-Side Rendering:**

```javascript
// Node.js - Render tokens server-side (PDFs, emails, etc.)
const tokenValues = require("@your-org/kami-design-tokens/dist/json/token-values.json");

function getTokenValue(tokenPath) {
  return tokenValues[tokenPath];
}

// Generate inline styles for email templates
const emailStyles = `
  background-color: ${getTokenValue("bg.surface")};
  color: ${getTokenValue("text.primary")};
  padding: ${getTokenValue("spacing.4")};
`;

// PDF generation with brand colors
const primaryColor = getTokenValue("action.primary-bg"); // "#2B4D86"
```

**Available Backend Artifacts:**

- `dist/json/token-names.json` - Flat array of 276+ valid token keys
- `dist/json/token-values.json` - Flat object mapping keys to resolved values

### Utility Classes (Quick Prototyping)

```html
<!-- Import utilities CSS for rapid development -->
<link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/utilities.css" />

<!-- Use pre-built utility classes -->
<div class="bg-primary text-white p-md rounded-button">Primary Card</div>

<button class="bg-primary-hover text-white px-lg py-sm rounded-button">Click Me</button>
```

**Available Utility Classes:**

- **Colors**: `.bg-{color}`, `.text-{color}`, `.border-{color}`
  - Example: `.bg-color-blue-600`, `.text-color-neutral-900`, `.bg-bg-surface`
- **Spacing**: `.p-{size}`, `.m-{size}`, `.px-{size}`, `.py-{size}`, `.gap-{size}`
  - Example: `.p-4`, `.mt-8`, `.gap-x-2`
- **Typography**: `.text-{size}`, `.font-{weight}`, `.leading-{height}`, `.font-{family}`
  - Example: `.text-xl`, `.font-bold`, `.leading-loose`, `.font-mono`
- **Flexbox**: `.flex`, `.flex-col`, `.items-center`, `.justify-between`, `.flex-wrap`
  - Includes display, direction, wrap, justify, align, and flex grow/shrink utilities
- **Opacity**: `.opacity-{value}` (0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100)
  - Example: `.opacity-50`, `.opacity-75`
- **Z-Index**: `.z-{value}` (0, 10, 20, 30, 40, 50, 100, 200, 999, 9999, auto)
  - Example: `.z-10`, `.z-50`, `.z-auto`

## Semantic Color Tokens

The design system provides semantic color tokens mapped to real-world UI patterns, ensuring consistency and accessibility.

### Usage Categories

**Backgrounds:**

```css
var(--bg-canvas)        /* Page background */
var(--bg-surface)       /* Card/panel backgrounds */
var(--bg-subtle)        /* Sidebar/header backgrounds */
var(--bg-brand-section) /* Brand-colored sections */
```

**Text:**

```css
var(--text-primary)     /* Main body text */
var(--text-secondary)   /* Metadata/labels */
var(--text-tertiary)    /* Disabled/placeholder */
var(--text-inverse)     /* Text on dark backgrounds */
var(--text-on-brand)    /* Text on brand colors */
```

**Actions (Buttons/Links):**

```css
var(--action-primary-bg)        /* Primary button background */
var(--action-primary-text)      /* Primary button text */
var(--action-primary-hover)     /* Primary button hover */
```

**Status/Feedback:**

```css
var(--status-success-bg)        /* Success message background */
var(--status-success-text)      /* Success message text */
var(--status-warning-bg)        /* Warning message background */
var(--status-error-bg)          /* Error message background */
var(--status-info-bg)           /* Info message background */
```

### Accessibility

All semantic color pairings meet **WCAG AA contrast requirements** (minimum 4.5:1 ratio):

- ✅ Text Primary on Canvas: **15.33:1**
- ✅ Primary Action Button: **8.37:1**
- ✅ Status Messages: **16+:1**

Run `node scripts/check-contrast.js` to verify contrast ratios.

## Multi-Theme Support

The repository supports multiple themes (e.g., light/dark mode) through theme override files.

### Using Themes

**In CSS:**

```html
<!-- Light theme (default) -->
<body>
  <link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/css/variables.css" />
  <!-- Content uses default theme -->
</body>

<!-- Dark theme -->
<body data-theme="dark">
  <link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/css/variables.css" />
  <link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/css/theme-dark.css" />
  <!-- Dark theme overrides are applied -->
</body>
```

**In JavaScript:**

```javascript
// Toggle theme
document.body.setAttribute("data-theme", "dark");

// Load theme tokens
import darkTheme from "@your-org/kami-design-tokens/json/theme-dark.json";
```

### Creating New Themes

1. Create a new file in `tokens/themes/` (e.g., `high-contrast.json`)
2. Define token overrides using references to primitives:

```json
{
  "bg": {
    "body": { "value": "{color.black}", "$type": "color" }
  },
  "text": {
    "primary": { "value": "{color.white}", "$type": "color" }
  }
}
```

3. Run `npm run build` to generate theme artifacts

## Token Directory Structure

The repository maintains a clear separation between **source tokens** (manually edited) and **generated tokens** (auto-generated):

```
tokens/
├── primitives/          # 📝 Source: Manual edits here
│   ├── colors.json      # Base color palette
│   ├── spacing.json     # Spacing scale
│   ├── typography.json  # Font families, weights, line heights, base sizes
│   ├── radius.json      # Border radius values
│   └── ...
├── generated/           # 🤖 Generated: Auto-created, do not edit
│   └── typography-scale.json  # Modular scale font sizes (calculated)
├── semantic/            # 📝 Source: Semantic token mappings
│   ├── colors.json      # UI role-based colors (bg, text, actions, status)
│   └── typography.json  # Typography configuration and references
└── themes/              # 📝 Source: Theme overrides
    └── dark.json        # Dark mode token overrides
```

**Important Notes:**

- **Source tokens** (`primitives/`, `semantic/`, `themes/`) are committed to Git and manually maintained
- **Generated tokens** (`generated/`) are auto-created during build and committed to Git
- **Watch mode** ignores `generated/` directory to prevent infinite rebuild loops
- **Style Dictionary** merges both source and generated tokens during build

## Documentation

📚 **[Live Token Documentation](https://kamishino.github.io/design-tokens/)**

View all design tokens visually with color swatches, typography specimens, spacing scales, and component examples. Perfect for designers and developers to verify token values.

## Repository Structure

```
kami-design-tokens/
├── tokens/                    # Source token files (W3C DTCG format)
│   ├── primitives/           # Raw values (core palette, spacing, typography, etc.)
│   │   ├── colors.json
│   │   ├── spacing.json
│   │   ├── typography.json
│   │   ├── animation.json
│   │   ├── breakpoints.json
│   │   ├── grid.json
│   │   ├── radius.json
│   │   ├── scale.json
│   │   └── shadows.json
│   ├── semantic/             # Intent-based values (usage mapping)
│   │   ├── colors.json
│   │   ├── typography.json
│   │   └── animation.json
│   ├── themes/               # Theme overrides (dark mode, high contrast, etc.)
│   │   └── dark.json
│   └── schema.json           # JSON Schema for validation
├── site/                      # Preview site source (Vite + TypeScript)
│   ├── index.html            # Entry point
│   ├── main.ts               # Client-side rendering logic
│   └── style.css             # Preview-specific styles
├── scripts/                   # Build utilities
│   ├── build-tokens.js       # Multi-theme Style Dictionary build
│   ├── build-utilities.js    # Utility classes generator
│   ├── validate-tokens.js    # Schema & reference validation
│   └── test-tokens.js        # Build output tests
├── dist/                      # Generated artifacts (gitignored, included in npm)
│   ├── css/                  # CSS variables
│   │   ├── variables.css     # Base tokens (:root)
│   │   └── theme-*.css       # Theme overrides ([data-theme="*"])
│   ├── scss/                 # SCSS variables ($var)
│   ├── js/                   # JS/TS modules with strict types
│   ├── json/                 # JSON format
│   │   ├── tokens.json       # Base tokens
│   │   └── theme-*.json      # Theme tokens
│   └── utilities.css         # Pre-built utility classes
├── docs/                      # Visual documentation site (GitHub Pages)
│   └── index.html            # Built preview site
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── style-dictionary.config.js # Style Dictionary configuration
├── WORKFLOW.md               # End-to-end workflow documentation
├── package.json
└── README.md
```

## Development

### Prerequisites

- Node.js 16+ (Node.js 20+ recommended for ESM support)
- NPM 8+

**Note**: This project uses ECMAScript Modules (ESM). All build scripts use `import/export` syntax instead of `require/module.exports`.

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/kami-design-tokens.git
cd kami-design-tokens

# Install dependencies
npm install

# Build tokens
npm run build
```

### Development Workflow

```bash
# Start watch mode + dev server (recommended for development)
npm run dev

# This command runs two processes in parallel:
# 1. Token watcher: Monitors tokens/ folder and rebuilds on changes
# 2. Vite dev server: Serves documentation site with HMR at http://localhost:5173/design-tokens/
#
# ✨ Live Reload: Edit any token file → automatic rebuild → browser refreshes
# 🔥 Hot Module Replacement: Edit site source files → instant browser updates (no rebuild)
# 🎯 Fast Feedback: See design changes instantly without manual rebuild
```

### Scripts

```bash
npm run dev                     # 🔥 Watch mode + preview server (parallel execution with live reload)
npm run build                   # Build all artifacts (grouped: core → exports → site)
npm run build:core              # Build core tokens (validate → scale → compile)
npm run build:exports           # Build all exports (backend, utils, figma)
npm run build:site              # Build documentation site only
npm run tokens:scale            # Generate font sizes from modular scale ratio
npm run tokens:compile          # Build tokens only (CSS, SCSS, JS, JSON)
npm run tokens:validate         # Validate token structure and references
npm run tokens:test             # Run build output tests
npm run tokens:watch            # Watch tokens/ folder and rebuild on changes (auto-used by dev)
npm run tokens:export-backend   # Build backend artifacts (token-names.json, token-values.json)
npm run tokens:export-figma     # Generate Figma-optimized tokens with scoping
npm run tokens:export-utils     # Generate utility classes
npm run site:build              # Build documentation site (Vite production build)
npm run site:serve              # Start Vite dev server with HMR (used by npm run dev)
npm run site:preview            # Preview production build locally
npm test                        # Run all tests (alias for tokens:test)
npm run clean                   # Clean dist and docs folders
npm run pack:dry                # Preview package contents before publishing

# Maintenance
npm run tasks:archive           # Archive completed task files to tasks/_archived/

# Utilities
node scripts/check-contrast.js  # Verify WCAG AA color contrast compliance

# Script Groups (for internal reference)
npm run build:core              # tokens:validate → tokens:scale → tokens:compile
npm run build:exports           # tokens:export-backend → tokens:export-utils → tokens:export-figma
```

## Typography System

The design system features a comprehensive typography system with three layers: **Primitives**, **Semantic Configuration**, and **Dynamic Generation**.

### 1. Fixed UI Sizes (`font.size.basic.*`)

**Purpose**: Predictable, stable sizes for UI components and static content

**Complete Range** (12px-72px):

- `basic.xs` → 12px - Captions, labels, helper text
- `basic.sm` → 14px - Button labels, form inputs
- `basic.base` → 16px - Body text, standard components
- `basic.lg` → 18px - Emphasized text, section labels
- `basic.xl` → 20px - Subheadings, callouts
- `basic.2xl` → 24px - Section headers, card titles
- `basic.3xl` → 30px - Page titles, feature headlines
- `basic.4xl` → 36px - Major section headers
- `basic.5xl` → 48px - Hero elements, large displays
- `basic.6xl` → 60px - Major hero text
- `basic.7xl` → 72px - Giant displays, hero numbers

**CSS Variables**: `--font-size-basic-xs` through `--font-size-basic-7xl`

**Stability**: These values are **manually defined** and never change, even if you modify the modular scale ratio.

### 2. Dynamic Modular Scale (`font.size.scale.*`)

**Purpose**: Complete typography hierarchy calculated using a mathematical ratio

**How it works**:

1. Script reads base size from `font.size.basic.base` (16px)
2. Reads scale ratio from `semantic/typography.json` (1.25 = Major Third by default)
3. Generates modular scale: **Steps -2 to 8** (11 harmonious sizes)

**Generated Steps**:

- **Step -2**: 10px (base × 1.25⁻²) - Small print, legal text
- **Step -1**: 13px (base × 1.25⁻¹) - Captions, footnotes
- **Step 0**: 16px (base × 1.25⁰) - Base/body text reference
- **Step 1**: 20px (base × 1.25¹) - Small heading/H6
- **Step 2**: 25px (base × 1.25²) - H5
- **Step 3**: 31px (base × 1.25³) - H4
- **Step 4**: 39px (base × 1.25⁴) - H3
- **Step 5**: 49px (base × 1.25⁵) - H2
- **Step 6**: 61px (base × 1.25⁶) - H1
- **Step 7**: 76px (base × 1.25⁷) - Display
- **Step 8**: 95px (base × 1.25⁸) - Hero

**CSS Variables**: `--font-size-scale-2`, `--font-size-scale-1`, `--font-size-scale-0` through `--font-size-scale-8`

**Dynamic**: Change the ratio in `scale.json` and rebuild to update only the modular scale sizes without affecting UI components!

### 3. Semantic Typography (`typography.*`)

**Purpose**: Developer-friendly names that map to appropriate primitive sizes

**Configuration**:

```json
{
  "typography.config.scale-ratio": "{scale.major-third}"
}
```

Change this single token to switch the entire modular scale ratio!

**UI Text Mappings**:

- `typography.ui.text.xs` → `font.size.basic.xs`
- `typography.ui.text.sm` → `font.size.basic.sm`
- `typography.ui.text.body` → `font.size.basic.base`
- `typography.ui.text.lg` → `font.size.basic.lg`

**Heading Mappings**:

- `typography.heading.h1` → `font.size.scale.6` (61px with Major Third)
- `typography.heading.h2` → `font.size.scale.5` (49px)
- `typography.heading.h3` → `font.size.scale.4` (39px)
- `typography.heading.h4` → `font.size.scale.3` (31px)
- `typography.heading.h5` → `font.size.scale.2` (25px)
- `typography.heading.h6` → `font.size.scale.1` (20px)
- `typography.heading.display` → `font.size.scale.7` (76px)
- `typography.heading.hero` → `font.size.scale.8` (95px)

**CSS Variables**: `--typography-heading-h1`, `--typography-ui-text-body`, etc.

**Usage**:

```css
h1 {
  font-size: var(--typography-heading-h1);
}
button {
  font-size: var(--typography-ui-text-sm);
}
```

## Grid System

The design system features a responsive 12-column grid with mathematically optimized container widths and adaptive gutters.

### Responsive Gutters

**Purpose**: Device-appropriate spacing that adapts to screen size

**Gutter Widths**:

- **Mobile** (`grid.gutter.mobile`): 16px - Compact spacing for small screens
- **Tablet** (`grid.gutter.tablet`): 24px - Balanced spacing for medium screens
- **Desktop** (`grid.gutter.desktop`): 32px - Generous spacing aligned to 8pt grid

**CSS Variables**: `--grid-gutter-mobile`, `--grid-gutter-tablet`, `--grid-gutter-desktop`

### Fixed Containers

**Purpose**: Centered, max-width containers for marketing pages and content sites

**Container Widths** (calculated using `(ColWidth × 12) + (Gutter × 11)`):

- **sm**: 720px - Small devices, Bootstrap aligned
- **md**: 936px - Tablets (divisible by 12 and 8)
- **lg**: 1136px - Small desktops (divisible by 8)
- **xl**: 1312px - Large desktops (divisible by 8)
- **2xl**: 1536px - Extra large screens (divisible by 8, 4K optimized)

**CSS Variables**: `--grid-container-sm` through `--grid-container-2xl`

**Usage**:

```css
.container {
  max-width: var(--grid-container-lg);
  margin: 0 auto;
  padding: 0 var(--grid-gutter-desktop);
}
```

### Fluid Containers

**Purpose**: Full-width layouts with responsive padding for dashboards and applications

**Padding Values**:

- **Mobile**: 16px horizontal padding
- **Tablet**: 24px horizontal padding
- **Desktop**: 32px horizontal padding

**CSS Variables**: `--grid-container-fluid-padding-mobile`, `--grid-container-fluid-padding-tablet`, `--grid-container-fluid-padding-desktop`

**Usage**:

```css
.container-fluid {
  width: 100%;
  padding: 0 var(--grid-container-fluid-padding-desktop);
}
```

### Breakpoint Alignment

All breakpoints comfortably exceed their respective container widths:

- **xs**: 576px
- **sm**: 768px (> 720px container)
- **md**: 992px (> 936px container)
- **lg**: 1200px (> 1136px container)
- **xl**: 1400px (> 1312px container)
- **2xl**: 1640px (> 1536px container)

### Configuring the Scale Ratio

Edit `tokens/semantic/typography.json`:

```json
{
  "typography": {
    "config": {
      "scale-ratio": {
        "value": "{scale.golden}" // Change to any ratio from scale.json
      }
    }
  }
}
```

Run `npm run tokens:scale` to regenerate modular scale sizes with the new ratio!

## Token Structure

### Primitives

Raw foundational values:

```json
{
  "color": {
    "blue": {
      "50": "#e3f2fd",
      "500": "#2196f3",
      "900": "#0d47a1"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px"
  }
}
```

### Semantic

Intent-based tokens:

```json
{
  "color": {
    "primary": "{color.blue.500}",
    "background": "{color.neutral.50}"
  },
  "spacing": {
    "button-padding": "{spacing.md}"
  }
}
```

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes (e.g., token removal, structure change)
- **MINOR**: New tokens added (backward compatible)
- **PATCH**: Bug fixes, token value updates

## Migration Guide

If you're migrating from an embedded token system, see [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) for detailed instructions.

## CI/CD

GitHub Actions automatically:

1. Builds tokens on every push to `main`
2. Runs validation tests
3. (Optional) Publishes to NPM on release tags

## Contributing

1. Create a feature branch
2. Update tokens in `tokens/` directory
3. Run `npm run build` to generate artifacts
4. Test in consumer projects
5. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/kami-design-tokens/issues)
- **Documentation**: [Wiki](https://github.com/your-org/kami-design-tokens/wiki)
- **PRD**: See `tasks/0040-prd-design-tokens-repo.md`

## License

MIT © Your Organization

---

**Related Projects:**

- [front-end-starter](https://github.com/your-org/front-end-starter) - Consumes these tokens
- [backend-api](https://github.com/your-org/backend-api) - Uses JSON tokens for validation
