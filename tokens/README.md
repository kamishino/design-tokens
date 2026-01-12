# Design Tokens Source Files

This directory contains the source design tokens that will be transformed into platform-specific formats.

## Directory Structure

```
tokens/
├── primitives/       # Raw foundational values
│   ├── colors.json
│   ├── spacing.json
│   └── typography.json
├── semantic/         # Intent-based mappings
│   ├── colors.json
│   └── components.json
└── platforms/        # Platform-specific overrides (optional)
```

## Token Types

### Primitives
**Purpose:** Define the raw, foundational values of your design system.

**Examples:**
- Color palettes (blue-50 through blue-900)
- Spacing scales (xs, sm, md, lg, xl)
- Typography scales (font sizes, weights, line heights)
- Border radii
- Shadows

**Guidelines:**
- Use descriptive, literal names
- Include numeric scales or size variants
- These should rarely reference other tokens

### Semantic
**Purpose:** Define how primitives are used throughout your application.

**Examples:**
- `color-primary` → references `color.blue.500`
- `button-padding` → references `spacing.md`
- `text-color` → references `color.neutral.900`

**Guidelines:**
- Always reference primitive tokens using `{token.path}` syntax
- Use intent-based names (what it's for, not what it is)
- These make it easier to rebrand or theme your application

### Platforms (Optional)
**Purpose:** Override tokens for specific platforms or themes.

**Examples:**
- Mobile-specific spacing adjustments
- Dark mode color overrides
- Platform-specific typography

## Token Format

We follow the W3C Design Tokens Community Group (DTCG) format:

```json
{
  "token-name": {
    "$value": "actual-value-or-reference",
    "$type": "color|dimension|number|string|...",
    "$description": "Optional description"
  }
}
```

### Token References
Reference other tokens using curly braces:
```json
{
  "color": {
    "primary": {
      "$value": "{color.blue.500}",
      "$type": "color"
    }
  }
}
```

## Editing Tokens

### 1. Manual Editing
Edit JSON files directly in this directory.

### 2. Figma Sync (if configured)
Tokens can be synced from Figma using Token Studio plugin:
```bash
npm run sync
```

### 3. Validation
After editing, validate your changes:
```bash
npm run validate
```

### 4. Build
Generate platform artifacts:
```bash
npm run build
```

## Token Naming Conventions

### Colors
- **Primitives:** `color-{hue}-{scale}`
  - Example: `color-blue-500`
- **Semantic:** `color-{usage}-{variant}`
  - Example: `color-primary`, `color-text-secondary`

### Spacing
- **Primitives:** `spacing-{size}`
  - Example: `spacing-xs`, `spacing-md`, `spacing-2xl`
- **Semantic:** `{component}-{property}`
  - Example: `button-padding-x`, `card-gap`

### Typography
- **Primitives:** `fontSize-{size}`, `fontWeight-{name}`
  - Example: `fontSize-lg`, `fontWeight-bold`
- **Semantic:** `{component}-{property}`
  - Example: `heading-fontSize`, `body-lineHeight`

## Common Patterns

### Color System
```json
{
  "color": {
    "blue": {
      "50": "#e3f2fd",
      "500": "#2196f3",
      "900": "#0d47a1"
    }
  }
}
```

### Semantic Colors
```json
{
  "color": {
    "primary": "{color.blue.500}",
    "background": "{color.neutral.0}",
    "text": "{color.neutral.900}"
  }
}
```

### Component Tokens
```json
{
  "button": {
    "padding-x": "{spacing.md}",
    "padding-y": "{spacing.sm}",
    "font-size": "{fontSize.base}"
  }
}
```

## Best Practices

1. **Start with primitives** - Build a solid foundation first
2. **Use semantic tokens in code** - Don't reference primitives directly in applications
3. **Be consistent** - Follow naming conventions
4. **Document complex tokens** - Use `$description` field
5. **Test changes** - Validate and build before committing
6. **Version carefully** - Breaking changes need major version bumps

## Questions?

Refer to:
- Main [README.md](../README.md)
- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
