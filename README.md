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
@import '@your-org/kami-design-tokens/css';

/* Use tokens */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
}
```

### SCSS Variables
```scss
// Import in your SCSS
@import '@your-org/kami-design-tokens/scss/variables';

// Use tokens
.button {
  background-color: $color-primary;
  padding: $spacing-md;
}
```

### JavaScript/TypeScript
```javascript
// ES Modules
import tokens from '@your-org/kami-design-tokens';

// Use tokens with full autocomplete
const primaryColor = tokens.color.primary;
const spacing = tokens.spacing.md;
```

#### TypeScript with Strict Types
```typescript
// Full type safety and IDE autocomplete
import tokens from '@your-org/kami-design-tokens';

// TypeScript knows the exact structure
const buttonPadding: string = tokens.button['padding-x'];
const primaryColor: string = tokens.color.primary;

// Compile-time error if token doesn't exist
// const invalid = tokens.nonExistent.token; // ❌ TypeScript error
```

### Backend JSON

**For Validation:**
```javascript
// Node.js - Validate user input against valid token names
const validTokens = require('@your-org/kami-design-tokens/dist/json/token-names.json');

function validateToken(tokenName) {
  if (!validTokens.includes(tokenName)) {
    throw new Error(`Invalid token: ${tokenName}`);
  }
  return true;
}

// API endpoint validation
app.post('/theme', (req, res) => {
  const { primaryColor } = req.body;
  
  if (validateToken(primaryColor)) {
    res.json({ success: true });
  }
});
```

**For Server-Side Rendering:**
```javascript
// Node.js - Render tokens server-side (PDFs, emails, etc.)
const tokenValues = require('@your-org/kami-design-tokens/dist/json/token-values.json');

function getTokenValue(tokenPath) {
  return tokenValues[tokenPath];
}

// Generate inline styles for email templates
const emailStyles = `
  background-color: ${getTokenValue('bg.surface')};
  color: ${getTokenValue('text.primary')};
  padding: ${getTokenValue('spacing.4')};
`;

// PDF generation with brand colors
const primaryColor = getTokenValue('action.primary-bg'); // "#2B4D86"
```

**Available Backend Artifacts:**
- `dist/json/token-names.json` - Flat array of 276+ valid token keys
- `dist/json/token-values.json` - Flat object mapping keys to resolved values

### Utility Classes (Quick Prototyping)
```html
<!-- Import utilities CSS for rapid development -->
<link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/utilities.css">

<!-- Use pre-built utility classes -->
<div class="bg-primary text-white p-md rounded-button">
  Primary Card
</div>

<button class="bg-primary-hover text-white px-lg py-sm rounded-button">
  Click Me
</button>
```

**Available Utility Classes:**
- **Colors**: `.bg-{color}`, `.text-{color}`, `.border-{color}`
- **Spacing**: `.p-{size}`, `.m-{size}`, `.px-{size}`, `.py-{size}`, `.gap-{size}`
- **Typography**: `.text-{size}`, `.font-{weight}`, `.leading-{height}`

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
  <link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/css/variables.css">
  <!-- Content uses default theme -->
</body>

<!-- Dark theme -->
<body data-theme="dark">
  <link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/css/variables.css">
  <link rel="stylesheet" href="node_modules/@your-org/kami-design-tokens/dist/css/theme-dark.css">
  <!-- Dark theme overrides are applied -->
</body>
```

**In JavaScript:**
```javascript
// Toggle theme
document.body.setAttribute('data-theme', 'dark');

// Load theme tokens
import darkTheme from '@your-org/kami-design-tokens/json/theme-dark.json';
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
- Node.js 16+
- NPM 8+

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
# Start dev server with hot reload for preview site
npm run dev

# The preview site will open at http://localhost:5173
# Changes to tokens or site code will automatically reload
```

### Scripts
```bash
npm run dev                     # Start Vite dev server with HMR for preview site
npm run build                   # Build all artifacts (type scale, tokens, backend, utilities, preview)
npm run generate:type-scale     # Generate font sizes from modular scale ratio
npm run build:tokens            # Build tokens only (CSS, SCSS, JS, JSON)
npm run build:backend           # Build backend artifacts (token-names.json, token-values.json)
npm run build:utilities         # Generate utility classes
npm run build:preview           # Build documentation site (Vite production build)
npm run preview                 # Preview production build locally
npm run validate                # Validate token structure and references
npm test                        # Run build output tests
npm run clean                   # Clean dist and docs folders
npm run pack:dry                # Preview package contents before publishing

# Utilities
node scripts/check-contrast.js  # Verify WCAG AA color contrast compliance
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

### 2. Modular Scale (`font.size.scale.*`)

**Purpose**: Mathematically harmonious sizes for content hierarchy (headings, display text, hero sections)

**How It Works**:
1. **Define the ratio** in `tokens/primitives/scale.json` (e.g., `1.25` for Major Third)
2. **Run the generator**: `npm run generate:type-scale`
3. **Font sizes are calculated** automatically using: `base × (ratio ^ step)`

**Available Scale Ratios**:
- **Major Third** (`1.25`) - Harmonious, moderate contrast
- **Perfect Fourth** (`1.333`) - Balanced progression
- **Golden Ratio** (`1.618`) - Natural, dramatic scaling
- **Major Second** (`1.125`) - Subtle, tight scaling

**Generated Sizes** (16px base × 1.25 ratio):
- `scale.1` → 20px (H6 level) - `16 × 1.25¹`
- `scale.2` → 25px (H5 level) - `16 × 1.25²`
- `scale.3` → 31px (H4 level) - `16 × 1.25³`
- `scale.4` → 39px (H3 level) - `16 × 1.25⁴`
- `scale.5` → 49px (H2 level) - `16 × 1.25⁵`
- `scale.6` → 61px (H1 level) - `16 × 1.25⁶`
- `scale.7` → 76px (Display) - `16 × 1.25⁷`
- `scale.8` → 95px (Hero) - `16 × 1.25⁸`

**CSS Variables**: `--font-size-scale-1` through `--font-size-scale-8`

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
h1 { font-size: var(--typography-heading-h1); }
button { font-size: var(--typography-ui-text-sm); }
```

### Configuring the Scale Ratio

Edit `tokens/semantic/typography.json`:
```json
{
  "typography": {
    "config": {
      "scale-ratio": {
        "value": "{scale.golden}"  // Change to any ratio from scale.json
      }
    }
  }
}
```

Run `npm run generate:type-scale` to regenerate modular scale sizes with the new ratio!

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
