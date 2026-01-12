# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Style Dictionary Integration**: Migrated from custom build scripts to Style Dictionary for better maintainability and standards compliance
- **Strict TypeScript Definitions**: Auto-generated type definitions that mirror the exact token structure (not `any`)
- **Enhanced Validation**: Token validation now checks for:
  - Broken references (semantic tokens pointing to non-existent primitives)
  - Invalid color formats
  - Placeholder values (e.g., `{TODO}`)
  - Empty token values
- **Reference Checking**: Validates that all `{token.path}` references resolve correctly
- **Unified Build Command**: Single `npm run build` command that validates and builds all platforms
- **Utility Classes Generator**: Automatic generation of utility CSS classes for rapid prototyping
  - Background, text, and border color utilities
  - Spacing utilities (padding, margin, gap)
  - Typography utilities (font size, weight, line height)
- **Visual Documentation Site**: Auto-generated HTML preview site showing:
  - Color swatches with names and values
  - Typography specimens
  - Spacing visualizations
  - Component examples
- **Workflow Documentation**: Comprehensive `WORKFLOW.md` documenting the Figma-to-Code process
- **GitHub Pages Support**: Documentation site ready for deployment via GitHub Pages
- **Vite Development Environment**: Modern dev server with Hot Module Replacement (HMR)
  - Preview site now built with Vite + TypeScript
  - Instant feedback on token and UI changes
  - Proper HTML/CSS/TS files instead of string templates
  - `npm run dev` for development with auto-reload
- **Multi-Theme Support**: Architecture for multiple design themes
  - Themes directory for theme-specific token overrides
  - Dark theme included as example
  - Automatic generation of theme-scoped CSS with `[data-theme="*"]` selectors
  - Separate JSON artifacts for each theme
- **JSON Schema Validation**: Strict token structure validation
  - Comprehensive JSON Schema following W3C DTCG and Token Studio formats
  - Automatic validation against schema during build
  - AJV-powered validation with detailed error messages
  - Validates all token files (primitives, semantic, themes)
- **Enhanced Token Structure**: Expanded primitive tokens
  - Animation tokens (durations, easings)
  - Breakpoint tokens for responsive design
  - Grid system tokens
  - Border radius scale
  - Scale multipliers
  - Shadow definitions

### Changed
- **Build System**: Replaced individual build scripts with unified Style Dictionary configuration
- **Package Scripts**: Simplified to `build`, `validate`, `test`, `clean`, `pack:dry`
- **JSON Output**: Changed from `dist/json/theme.json` to `dist/json/tokens.json` for consistency
- **Build Process**: Now runs validation before building to catch errors early
- **Token Architecture**: Migrated from temp/ with updated, production-ready token values
- **Multi-Theme Build**: Build script now automatically detects and builds all themes in `tokens/themes/`

### Removed
- **Deprecated Scripts**: Removed `scripts/build-css.js`, `scripts/build-scss.js`, `scripts/build-js.js`, `scripts/build-json.js` in favor of Style Dictionary
- **Legacy Preview Generator**: Removed `scripts/build-preview.js` in favor of Vite-based build
- **Sync Script**: Removed from main scripts (to be implemented separately with Figma integration)

### Improved
- **TypeScript Experience**: Full IDE autocomplete and type safety for all tokens
- **Error Messages**: More descriptive validation errors with file names and token paths
- **Documentation**: Added TypeScript usage examples and updated structure documentation

## [1.0.0] - TBD

### Release Notes
First stable release of the centralized design tokens repository. This version establishes the Single Source of Truth (SSOT) for design values across all Kami platform projects.

**Breaking Changes:** N/A (initial release)

**Migration Required:** Projects using embedded design tokens should follow the MIGRATION_GUIDE.md

---

## Version History Template

### [Version] - YYYY-MM-DD

#### Added
- New features or tokens

#### Changed
- Changes to existing tokens (non-breaking)

#### Deprecated
- Tokens marked for future removal

#### Removed
- Tokens that have been removed (breaking change)

#### Fixed
- Bug fixes

#### Security
- Security improvements
