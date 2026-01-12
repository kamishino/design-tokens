# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Figma Token Studio Optimization**: Automated token enrichment for seamless Figma integration
  - **Scoping Metadata**: Auto-inject `$extensions.studio.scope` for proper variable categorization
  - **$themes.json Generation**: Automatically generate Token Studio configuration from directory structure
  - **Token Enrichment**: Radius scoped to `borderRadius`, spacing to `spacing`, colors to `color`
  - **Multi-Theme Support**: Generates configurations for all theme files with proper enable/disable states
  - **Code → Figma Sync**: Optimized tokens in `dist/figma/` ready for direct Token Studio import
  - **Native Variables Ready**: Compatible with Figma Native Variables via Token Studio
- **CI/CD Pipeline Enhancement**: Production-ready automated build and deployment
  - **Strict Schema Validation**: Enabled validation in CI pipeline to catch invalid tokens before merge
  - **GitHub Pages Deployment**: Automatic documentation site deployment on push to main or release tags
  - **Artifact Verification**: Added logging to verify dist/ contents before upload
  - **Quality Gates**: Build fails immediately if tokens don't meet schema requirements
  - **Automated Docs**: Preview site automatically updated on every merge to main
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
- **Semantic Color System**: Comprehensive semantic color mappings
  - Background tokens (canvas, surface, subtle, brand-section)
  - Text tokens (primary, secondary, tertiary, inverse, on-brand)
  - Border tokens (subtle, default, strong, focus)
  - Action tokens (primary/secondary button states)
  - Status tokens (success, warning, error, info with bg/text/border/icon variants)
  - Brand tokens (primary, secondary, accent)
- **Accessibility Verification**: WCAG AA contrast compliance
  - Automated contrast ratio checking utility
  - All semantic pairings meet 4.5:1 minimum ratio
  - Contrast ratios ranging from 4.77:1 to 18.79:1
  - `check-contrast.js` script for validation
- **Backend Artifact Generation**: Server-side validation and rendering support
  - `token-names.json` - Flat array of 276+ valid token keys for input validation
  - `token-values.json` - Flat object mapping keys to resolved values for SSR
  - Automated flattening of nested token structure to dot notation
  - `build-backend.js` script integrated into main build process
- **Figma Workflow Documentation**: Comprehensive end-to-end process guide
  - Updated `WORKFLOW.md` with Token Studio export instructions
  - Backend consumption examples (validation, email templates, PDF generation)
  - Manual export process from Figma to Git repository
  - Clear instructions for designers, maintainers, and developers
- **Token Output Formatting**: Improved readability and organization of generated files
  - **CSS Category Headers**: Custom formatter groups tokens by category with comment headers (/* COLOR */, /* SPACING */, etc.)
  - **Theme CSS Formatting**: Theme files now use category separation matching base variables format
  - **Theme SCSS Maps**: New SCSS theme maps with category comments for better organization
  - **Alphabetical JSON Sorting**: Backend token-values.json now sorted alphabetically for cleaner diffs
  - **Visual Separation**: Clear category blocks in all CSS/SCSS files for easier manual inspection
  - **Deterministic Output**: Consistent ordering across builds for better version control
  - **Reusable Helper**: Extracted `getGroupedProperties()` function for consistent grouping logic
- **Comprehensive Typography System**: Three-layer architecture with full range and semantic configuration
  - **Expanded Basic Sizes** (`font.size.basic.*`): Complete utility range from 12px to 72px (11 sizes: xs-7xl)
  - **Modular Scale** (`font.size.scale.*`): Dynamic content hierarchy (20px-95px) calculated from configurable ratio
  - **Semantic Layer** (`tokens/semantic/typography.json`): Developer-friendly names and configuration
    - `typography.config.scale-ratio`: Single token to configure modular scale ratio
    - `typography.ui.text.*`: Semantic UI text mappings (xs, sm, body, lg)
    - `typography.heading.*`: Semantic heading mappings (h1-h6, display, hero)
  - **Dynamic Ratio Resolution**: Generator reads `{scale.major-third}` reference and resolves actual value
  - **Configurability**: Change `scale-ratio` token, rebuild, all headings update automatically
  - CSS variables: `--font-size-basic-*`, `--font-size-scale-*`, `--typography-heading-*`, `--typography-ui-text-*`
  - Integrated into build pipeline, runs before Style Dictionary
- **Primitive Token Standardization**: Consistent, best-practice token structure
  - Breakpoints updated to mobile-first standards (640px, 768px, 1024px, 1280px, 1536px)
  - Grid tokens now reference spacing scale for gutter and margin
  - Animation tokens already follow industry standards (durations, easing curves)
  - Scale tokens provide musical/mathematical ratios for modular scaling

### Changed
- **Breakpoints**: Updated from Bootstrap-style to Tailwind-style mobile-first breakpoints
- **Grid System**: Gutter now references `spacing.6` (24px), added margin token referencing `spacing.8`
- **Typography Structure**: Separated `font.size` into `basic` (fixed UI) and `scale` (dynamic content) namespaces
- **Type Scale Generation**: Now targets only `font.size.scale.*`, preserving `font.size.basic.*` stability
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
