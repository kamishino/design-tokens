/**
 * Unified Icon Registry for Token Management Dashboard
 *
 * Maps semantic names to Tabler Icon classes for consistent icon usage.
 * All icons use the 'ti ti-{name}' format from Tabler Icons.
 *
 * @see https://tabler-icons.io/
 */

export const Icons = {
  // Navigation & Categories
  FILES: "ti ti-files",
  PALETTE: "ti ti-palette",
  LAYERS: "ti ti-layers-linked",
  MOON: "ti ti-moon",
  FILE_CODE: "ti ti-file-code",
  BRAND: "ti ti-brand-tabler",

  // CRUD Actions
  ADD: "ti ti-plus",
  PLUS: "ti ti-plus", // Alias for ADD
  EDIT: "ti ti-edit",
  DELETE: "ti ti-trash",
  SAVE: "ti ti-device-floppy",
  CHECK: "ti ti-check",
  CANCEL: "ti ti-x",
  TAG: "ti ti-tag", // For brands and labels

  // Navigation Actions
  CHEVRON_DOWN: "ti ti-chevron-down",
  CHEVRON_RIGHT: "ti ti-chevron-right",
  CHEVRON_UP: "ti ti-chevron-up",
  CHEVRON_LEFT: "ti ti-chevron-left",

  // Status & Indicators
  ALERT: "ti ti-alert-circle",
  INFO: "ti ti-info-circle",
  SUCCESS: "ti ti-circle-check",
  WARNING: "ti ti-alert-triangle",
  ERROR: "ti ti-circle-x",

  // UI Elements
  SEARCH: "ti ti-search",
  FILTER: "ti ti-filter",
  SETTINGS: "ti ti-settings",
  REFRESH: "ti ti-refresh",
  DOWNLOAD: "ti ti-download",
  UPLOAD: "ti ti-upload",
  CODE: "ti ti-code",

  // Token Types
  COLOR: "ti ti-color-swatch",
  TYPOGRAPHY: "ti ti-typography",
  SPACING: "ti ti-layout-distribute-vertical",
  BORDER: "ti ti-border-style",
  SHADOW: "ti ti-shadow",

  // Misc
  LOADING: "spinner-border",
  MENU: "ti ti-menu-2",
  CLOSE: "ti ti-x",

  // Multi-project & Collaboration
  FLASK: "ti ti-flask",
  GIT: "ti ti-git-branch",
  FOLDER: "ti ti-folder",
  LINK: "ti ti-link",
} as const;

/**
 * Helper function to get icon class with error handling
 */
export function getIcon(iconKey: keyof typeof Icons): string {
  return Icons[iconKey] || Icons.FILES;
}

/**
 * Type-safe icon keys
 */
export type IconKey = keyof typeof Icons;
