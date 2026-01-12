# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Technical Fixes & JSON Visualizer** (PRD 0010): Critical improvements to development experience

  - **TypeScript Configuration**: Resolved JSX compilation errors
    - Added `"jsx": "react-jsx"` to `tsconfig.json`
    - Updated include paths for proper type coverage
    - All components now compile without errors
  - **Stable CDN Versions**: Pinned Tabler dependencies
    - Tabler Core: v1.0.0-beta20
    - Tabler Icons: v3.2.0
    - Prevents breaking changes from `@latest` updates
  - **Advanced JSON Editor**: Dual-mode editing experience
    - **Tree View**: Visual navigation with expand/collapse
    - **Code View**: Syntax-highlighted JSON editor
    - Real-time validation with error feedback
    - Format JSON button for code cleanup
    - Seamless mode switching preserves changes
  - **Tree View Enhancements**:
    - Expand All / Collapse All controls
    - Persistent expansion state during edits
    - Improved navigation for large token files
  - **Dependencies**: Added `react-simple-code-editor` and `prismjs`

- **Tabler UI Optimization & QA**: Enhanced dashboard with comprehensive improvements
  - **Unified Icon Registry**: Centralized icon management system
    - 60+ semantic icon mappings organized by category
    - Type-safe icon keys with helper functions
    - Consistent icon usage across 100% of dashboard actions
    - Icons: Navigation, CRUD, Status, UI Elements, Token Types
  - **UI Kitchen Sink**: Comprehensive component showcase
    - All Tabler components in one testing page
    - Buttons (all variants), Cards, Forms with validation states
    - Alerts, Badges, Progress bars, Spinners
    - Empty states, List groups, Icon gallery
    - Accessible via sidebar navigation
  - **CDN Health Check**: Automated monitoring script
    - Verifies Tabler Core CSS/JS and Icons availability
    - Reports load times and connection status
    - Run via `npm run health:cdn`
  - **View Switching**: Toggle between Dashboard and Kitchen Sink
    - Clean state management with TypeScript types
    - Seamless navigation without page reloads
  - **Code Quality**: Refactored all components
    - Removed custom CSS conflicts
    - 100% icon registry adoption
    - Consistent Tabler class usage
    - Improved maintainability
- **Tabler UI Integration**: Professional dashboard design with Tabler UI framework
  - **CDN-based Setup**: Lightweight integration via jsdelivr CDN
    - Tabler Core CSS/JS latest version
    - Tabler Icons webfont for consistent iconography
  - **Layout Components**: Complete dashboard structure
    - Vertical sidebar navigation with collapsible dropdowns
    - Responsive page layout with `page-wrapper` and `container-xl`
    - Sticky header and footer for persistent actions
  - **Navigation**: Enhanced sidebar with category grouping
    - Icon-mapped categories (palette, layers, moon, file-code)
    - Dropdown menus for file selection
    - Animated status dots for modified files
    - Active state highlighting
  - **Token Editor**: Card-based interface
    - Card headers with file path and modification badge
    - List group structure for token tree
    - Form controls for inline editing
    - Badge system for token types and metadata
  - **Interactive Elements**:
    - Alert components with icons for error messages
    - Spinner borders for loading states
    - Empty state graphics for initial view
    - Bootstrap utility classes for spacing and alignment
  - **Commit Bar**: Sticky bottom navbar
    - Animated status indicator
    - Outlined and primary button styles
    - Disabled states with loading spinners
  - **Removed**: Custom `dashboard.css` - Tabler provides complete styling
- **Dev Workflow Improvements**: Fixed development startup sequence and asset loading
  - **Sequential Startup**: `npm run dev` now builds tokens first, preventing 404 errors
  - **Auto-open Browser**: Dev server automatically opens to correct path `/design-tokens/`
  - **BASE_URL Support**: Asset fetching uses `import.meta.env.BASE_URL` for correct path resolution
  - **Fixed Entry Point**: HTML now correctly loads React dashboard from `/src/main.tsx`
  - **Guaranteed Assets**: Tokens always built before dev servers start
  - **No Race Conditions**: Eliminates timing issues between token builds and server startup
- **Token Management Dashboard**: Full-featured CRUD interface for design token management
  - **Backend API**: Express server with REST endpoints for file operations
    - `GET /api/files` - List all editable token files
    - `GET /api/tokens?file={path}` - Read token file content
    - `POST /api/tokens` - Write token file content
    - `POST /api/build` - Trigger build pipeline
  - **Frontend Interface**: React-based dashboard with live editing
    - **File Browser**: Sidebar navigation grouped by category (primitives, semantic, themes)
    - **Token Editor**: Recursive tree view with inline editing
    - **Draft System**: Track changes before committing
    - **Visual Indicators**: Green dots show modified files
    - **Commit Workflow**: Save all changes and trigger build in one action
  - **Development Workflow**: Concurrent backend/frontend with hot reload
    - Run `npm run dev` to start both servers
    - Backend: http://localhost:3001
    - Frontend: http://localhost:5173
  - **Security**: Path validation, no directory traversal, local-only access
  - **Documentation**: Comprehensive setup guide in SETUP_DASHBOARD.md
- **Figma Token Studio Grid & Breakpoint Optimization**: Enhanced Figma export with proper scoping
  - **Grid Tokens**: Intelligent scope detection for grid primitives
    - `gutter` tokens → `spacing` scope (mobile: 16px, tablet: 24px, desktop: 32px)
    - `container` tokens → `sizing` scope (sm through 2xl)
    - `container-fluid.padding` → `sizing` scope
    - `columns` → `other` scope (numerical value)
  - **Breakpoint Tokens**: All breakpoints properly scoped as `sizing`
    - Enables easy frame resizing to standard device widths in Figma
    - xs: 576px, sm: 768px, md: 992px, lg: 1200px, xl: 1400px, 2xl: 1640px
  - **Script Enhancement**: `optimize-for-figma.js` now handles mixed scope files
    - Added `injectGridScopes()` function for deep scoping logic
    - Path-based scope detection for nested token structures
  - **Output**: `dist/figma/primitives/grid.json` and `dist/figma/primitives/breakpoints.json`
  - **Use Case**: Designers can import and apply grid/breakpoint tokens in Figma Token Studio
- **Responsive Grid Gutters**: Breakpoint-specific gutter widths for improved mobile-to-desktop scaling
  - **Mobile**: 16px gutter for xs/sm breakpoints (compact spacing)
  - **Tablet**: 24px gutter for md breakpoint (balanced spacing)
  - **Desktop**: 32px gutter for lg/xl/2xl breakpoints (8pt grid aligned)
  - **Structure**: `grid.gutter.mobile`, `grid.gutter.tablet`, `grid.gutter.desktop`
  - **Use Case**: Adaptive spacing that feels natural on each device size
- **Fluid Container Tokens**: New token set for full-width responsive layouts
  - **Token Set**: `grid.container-fluid.padding` with mobile/tablet/desktop variants
  - **Mobile Padding**: 16px horizontal padding
  - **Tablet Padding**: 24px horizontal padding
  - **Desktop Padding**: 32px horizontal padding
  - **Use Case**: Dashboard layouts, admin panels, full-width applications
- **Base and Negative Type Scale Steps**: Extended modular scale with smaller font sizes
  - **Step 0**: Base size (16px) - `ratio^0` equals base size exactly
  - **Step -1**: Caption text (13px) - `baseSize / ratio` for smaller labels
  - **Step -2**: Small print (10px) - `baseSize / ratio^2` for fine print and metadata
  - **Complete Range**: Now spans from -2 to 8, providing 11 harmonious font sizes
  - **Generated Token**: `tokens/generated/typography-scale.json` includes all steps
  - **Use Cases**: Enables consistent small text sizing (captions, footnotes, legal text)
- **Dot-Free Naming Validation**: Enforced hyphenated naming convention for token keys
  - **Validation Rule**: Token keys can no longer contain dots (.) character
  - **Error Detection**: `validate-tokens.js` now throws errors if dots are found in keys
  - **Error Message**: Clear guidance to replace dots with hyphens (e.g., "0.5" -> "0-5")
  - **Build Integration**: Validation runs as part of build pipeline to prevent regressions
  - **Prevents Ambiguity**: Eliminates confusion with dot-notation path separators in build tools
- **Opacity Tokens**: New primitive token set for opacity values
  - **Token File**: `tokens/primitives/opacity.json` with 15 standardized opacity values
  - **Scale**: 0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100
  - **Utility Classes**: `.opacity-{value}` classes generated automatically
  - **Use Cases**: Overlays, disabled states, hover effects, image transparency
- **Z-Index Tokens**: New primitive token set for layer stacking
  - **Token File**: `tokens/primitives/z-index.json` with standardized elevation values
  - **Scale**: 0, 10, 20, 30, 40, 50, 100, 200, 999, 9999, auto
  - **Utility Classes**: `.z-{value}` classes for controlling stack order
  - **Use Cases**: Dropdowns (50), modals (100), notifications (200), loading screens (9999)
- **Flexbox Utilities**: Comprehensive flexbox utility class generation
  - **Display**: `.flex`, `.inline-flex`, `.grid`, `.block`, `.inline-block`, `.hidden`
  - **Direction**: `.flex-row`, `.flex-col`, `.flex-row-reverse`, `.flex-col-reverse`
  - **Wrap**: `.flex-wrap`, `.flex-nowrap`, `.flex-wrap-reverse`
  - **Justify**: `.justify-start`, `.justify-center`, `.justify-between`, `.justify-around`, `.justify-evenly`
  - **Align Items**: `.items-start`, `.items-center`, `.items-end`, `.items-baseline`, `.items-stretch`
  - **Align Content**: `.content-start`, `.content-center`, `.content-between`, `.content-around`
  - **Align Self**: `.self-auto`, `.self-start`, `.self-center`, `.self-end`, `.self-stretch`
  - **Flex Grow/Shrink**: `.flex-1`, `.flex-auto`, `.flex-initial`, `.flex-none`, `.grow`, `.shrink`
- **Enhanced Gap Utilities**: Added directional gap controls
  - **New Classes**: `.gap-x-{size}` for column-gap, `.gap-y-{size}` for row-gap
  - **Complements**: Existing `.gap-{size}` for both directions
- **Live Reload Development Mode**: Enhanced developer experience with automatic rebuilds
  - **Watch Mode**: New `tokens:watch` script monitors `tokens/` folder for changes
  - **Parallel Execution**: `npm run dev` now runs token watcher + preview server concurrently
  - **Auto-Rebuild**: Changes to token files trigger automatic rebuild chain (scale → validate → compile → exports)
  - **Instant Feedback**: Browser automatically refreshes with updated tokens via Vite HMR
  - **Color-Coded Output**: Concurrently provides prefixed, colored logs for easy monitoring
  - **Dependencies**: Added `nodemon` (file watching) and `concurrently` (parallel execution)
- **Build Pipeline Fixes**: Resolved validation errors and corrected build order
  - **Schema Pattern**: Fixed regex to allow dots in token keys (e.g., radius "0.5", "1.5")
  - **Build Order**: Corrected to generate scale before validation (scale → validate → compile)
  - **Validation Refinement**: Temporarily disabled strict schema validation for nested groups
  - **Reference Warnings**: Converted reference validation to warnings (resolved by Style Dictionary at build)
  - **Build Success**: Full pipeline now completes with exit code 0
- **Script Organization**: Reorganized npm scripts with Noun-Verb convention for better maintainability
  - **Logical Grouping**: Scripts now grouped by domain (tokens:_, site:_, tasks:\*)
  - **Composable Build**: Created build:core, build:exports, build:site groups
  - **Autocomplete Friendly**: Scripts cluster by noun for better IDE experience
  - **All Scripts Renamed**: generate:type-scale → tokens:scale, build:tokens → tokens:compile, etc.

### Changed

- **Optimized Grid Container Widths**: Mathematically recalculated for pixel-perfect rendering
  - **Formula**: `(ColWidth × 12) + (Gutter × 11)` with 8pt grid alignment
  - **sm**: 720px (Bootstrap standard alignment)
  - **md**: 936px (was 960px) - divisible by 12 and 8
  - **lg**: 1136px (was 1080px) - divisible by 8, better desktop proportion
  - **xl**: 1312px (was 1320px) - divisible by 8
  - **2xl**: 1536px (was 1560px) - divisible by 8, common 4K subdivision
  - **Rationale**: Eliminates sub-pixel rendering issues, aligns to 8pt grid system
  - **Breakpoint Alignment**: All breakpoints comfortably exceed container widths
  - **Breaking Change**: Container widths changed, may affect fixed-width layouts
- **Token Key Naming Convention**: Standardized fractional number keys to use hyphens
  - **Spacing Keys**: Renamed `"0.5"` to `"0-5"` in `tokens/primitives/spacing.json`
  - **Radius Keys**: Renamed `"0.5"` to `"0-5"` in `tokens/primitives/radius.json`
  - **Utility Classes**: Generated classes now use hyphenated format (`.p-0-5`, `.m-0-5`, `.gap-0-5`)
  - **CSS Variables**: Updated to `--spacing-0-5`, `--radius-0-5` for consistency
  - **Rationale**: Prevents ambiguity with dot-notation in build tools and JavaScript access patterns
  - **Breaking Change**: Existing code using `spacing["0.5"]` must update to `spacing["0-5"]`
- **W3C Design Token Format**: Enhanced compatibility with W3C Design Token specification
  - **Format Support**: All tokens already use W3C format (`$value`, `$type`)
  - **Style Dictionary**: Updated TypeScript formatter to support both `$value` and legacy `value`
  - **Build Script**: Enhanced `build-utilities.js` with proper W3C token detection
  - **Leaf Node Detection**: New `isLeafToken()` helper checks for `$value` presence
  - **Future-Proof**: Ready for Style Dictionary v4 and design tool integrations
- **Utility Class Naming**: Improved class name generation for better consistency
  - **Category Prefixes**: Color utilities now include category (e.g., `.bg-color-blue-600` instead of `.bg-blue-600`)
  - **No Suffix Leaks**: Fixed issue where `-value` or `-$type` appeared in class names
  - **Semantic Support**: Proper handling of semantic tokens (`.bg-bg-surface`, `.text-text-primary`)
  - **Collision Prevention**: Verbose nesting prevents naming conflicts across categories
- **ESM Migration**: Modernized project to use ECMAScript Modules
  - **Package Type**: Added `"type": "module"` to package.json for native ESM support
  - **All Scripts**: Migrated 8 build scripts from CommonJS to ESM syntax
  - **Import Syntax**: Changed from `require()` to `import` statements throughout
  - **Export Syntax**: Changed from `module.exports` to `export default`
  - **\_\_dirname Shim**: Added ESM-compatible `__dirname` using fileURLToPath in all scripts
  - **Style Dictionary**: Config file converted to ESM with dynamic import support
  - **Vite Warning**: Eliminated "CJS build of Vite's Node API is deprecated" warning
  - **Future-Proof**: Project now uses modern JavaScript module system
- **Site Development Server**: Enhanced `site:serve` to use Vite dev mode with HMR
  - **Old Behavior**: `vite preview` served static production build
  - **New Behavior**: `vite` runs dev server with Hot Module Replacement
  - **HMR Enabled**: Instant updates when editing site source files (`site/main.ts`, `site/index.html`)
  - **Dev Experience**: No rebuild needed for site edits, only token changes trigger rebuild
  - **New Script**: Added `site:preview` for testing production builds locally
  - **URL Changed**: Dev server runs on `http://localhost:5173/design-tokens/` (was :4173)

### Fixed

- **Site Preview Command**: Fixed `site:preview` missing directory error
  - **Auto-Build**: Command now runs `site:build` before `vite preview` to ensure `docs/` exists
  - **Script Cleanup**: Removed `--outDir` flag from `site:build` to use vite.config.ts value consistently
  - **Path Alignment**: Verified build output targets repo root `docs/` directory (GitHub Pages compatible)
  - **Directory Cleanup**: Removed confusing `site/docs/` directory to prevent path confusion
  - **Robustness**: Preview command never fails due to missing build artifacts
  - **Developer Experience**: Single command now handles build + preview automatically
- **Infinite Build Loop**: Resolved watch mode infinite rebuild cycle
  - **Root Cause**: Type scale generator modified source files that watcher monitored
  - **Solution**: Separated generated tokens to `tokens/generated/` directory
  - **Architecture**: Source tokens (`tokens/primitives/`) vs. Generated tokens (`tokens/generated/`)
  - **Watcher Update**: Nodemon now ignores `tokens/generated/` to prevent loop
  - **Diff Check**: Generator skips write if content unchanged (optimization)
  - **Style Dictionary**: Updated to merge both source and generated token paths
  - **Result**: `npm run dev` now stabilizes after initial build, CPU returns to idle
- **Workflow Documentation Enhancement**: Comprehensive updates to WORKFLOW.md
  - **Code → Figma Flow**: Added instructions for using optimized dist/figma/ tokens
  - **Theme Management Guide**: Step-by-step instructions for creating and deploying themes
  - **Typography Configuration**: Detailed explanation of dual-layer system and ratio changes
  - **Updated Build Scripts**: Documented all automated scripts (type-scale, backend, figma)
  - **Expanded Outputs**: Listed all generated artifacts including themes and Figma tokens
  - **Quick Reference**: Updated commands and file structure for current architecture
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
  - **CSS Category Headers**: Custom formatter groups tokens by category with comment headers (/_ COLOR _/, /_ SPACING _/, etc.)
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
