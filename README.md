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
```javascript
// Node.js
const tokens = require('@your-org/kami-design-tokens/json');

// Validate theme colors
app.post('/theme', (req, res) => {
  const userColor = req.body.color;
  if (tokens.colors[userColor]) {
    // Valid color
  }
});
```

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
npm run dev                # Start Vite dev server with HMR for preview site
npm run build              # Build all artifacts (tokens, utilities, preview site)
npm run build:tokens       # Build tokens only (CSS, SCSS, JS, JSON)
npm run build:utilities    # Generate utility classes
npm run build:preview      # Build documentation site (Vite production build)
npm run preview            # Preview production build locally
npm run validate           # Validate token structure and references
npm test                   # Run build output tests
npm run clean              # Clean dist and docs folders
npm run pack:dry           # Preview package contents before publishing
```

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
