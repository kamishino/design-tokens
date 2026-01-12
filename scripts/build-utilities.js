/**
 * Generate Utility CSS Classes from Design Tokens
 * Creates a utilities.css file with helper classes for quick prototyping
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOKENS_DIR = path.join(__dirname, "../tokens");
const OUTPUT_FILE = path.join(__dirname, "../dist/utilities.css");

async function buildUtilities() {
  console.log(chalk.blue("🎨 Building utility classes...\n"));

  try {
    await fs.ensureDir(path.dirname(OUTPUT_FILE));

    // Load all tokens
    const primitives = await loadTokens(path.join(TOKENS_DIR, "primitives"));
    const semantic = await loadTokens(path.join(TOKENS_DIR, "semantic"));

    let css = "/* Generated Utility Classes - DO NOT EDIT MANUALLY */\n";
    css += "/* Last updated: " + new Date().toISOString() + " */\n\n";

    // Generate color utilities
    css += "/* ========== Color Utilities ========== */\n\n";
    css += generateColorUtilities(primitives, semantic);

    // Generate spacing utilities
    css += "\n/* ========== Spacing Utilities ========== */\n\n";
    css += generateSpacingUtilities(primitives, semantic);

    // Generate typography utilities
    css += "\n/* ========== Typography Utilities ========== */\n\n";
    css += generateTypographyUtilities(primitives, semantic);

    // Generate flexbox utilities
    css += "\n/* ========== Flexbox Utilities ========== */\n\n";
    css += generateFlexUtilities();

    // Generate opacity utilities
    css += "\n/* ========== Opacity Utilities ========== */\n\n";
    css += generateOpacityUtilities(primitives);

    // Generate z-index utilities
    css += "\n/* ========== Z-Index Utilities ========== */\n\n";
    css += generateZIndexUtilities(primitives);

    // Generate border utilities
    css += "\n/* ========== Border Utilities ========== */\n\n";
    css += generateBorderUtilities(semantic);

    await fs.writeFile(OUTPUT_FILE, css, "utf-8");

    console.log(chalk.green("✓ Utility classes generated:"), OUTPUT_FILE);
  } catch (error) {
    console.error(chalk.red("✗ Error building utilities:"), error.message);
    process.exit(1);
  }
}

async function loadTokens(dir) {
  const tokens = {};

  if (!(await fs.pathExists(dir))) {
    return tokens;
  }

  const files = await fs.readdir(dir);

  for (const file of files) {
    if (file.endsWith(".json")) {
      const filePath = path.join(dir, file);
      const content = await fs.readJSON(filePath);
      Object.assign(tokens, content);
    }
  }

  return tokens;
}

function generateColorUtilities(primitives, semantic) {
  let css = "";
  const colors = {};

  // Collect all color tokens from primitives
  if (primitives.color) {
    collectTokens(primitives.color, colors, "color");
  }

  // Collect semantic color tokens
  for (const [category, tokens] of Object.entries(semantic)) {
    if (category === "bg" || category === "text" || category === "border" || category === "action" || category === "status" || category === "brand") {
      collectTokens(tokens, colors, category);
    }
  }

  // Generate background color utilities
  css += "/* Background Colors */\n";
  for (const [name, value] of Object.entries(colors)) {
    const className = name.replace(/\./g, "-");
    css += `.bg-${className} { background-color: var(--${className}); }\n`;
  }

  css += "\n/* Text Colors */\n";
  for (const [name, value] of Object.entries(colors)) {
    const className = name.replace(/\./g, "-");
    css += `.text-${className} { color: var(--${className}); }\n`;
  }

  css += "\n/* Border Colors */\n";
  for (const [name, value] of Object.entries(colors)) {
    const className = name.replace(/\./g, "-");
    css += `.border-${className} { border-color: var(--${className}); }\n`;
  }

  return css;
}

function generateSpacingUtilities(primitives, semantic) {
  let css = "";
  const spacing = primitives.spacing || {};

  // Padding utilities
  css += "/* Padding */\n";
  for (const [key, tokenObj] of Object.entries(spacing)) {
    if (isLeafToken(tokenObj)) {
      const size = key;
      css += `.p-${size} { padding: var(--spacing-${size}); }\n`;
      css += `.px-${size} { padding-left: var(--spacing-${size}); padding-right: var(--spacing-${size}); }\n`;
      css += `.py-${size} { padding-top: var(--spacing-${size}); padding-bottom: var(--spacing-${size}); }\n`;
      css += `.pt-${size} { padding-top: var(--spacing-${size}); }\n`;
      css += `.pr-${size} { padding-right: var(--spacing-${size}); }\n`;
      css += `.pb-${size} { padding-bottom: var(--spacing-${size}); }\n`;
      css += `.pl-${size} { padding-left: var(--spacing-${size}); }\n`;
    }
  }

  // Margin utilities
  css += "\n/* Margin */\n";
  for (const [key, tokenObj] of Object.entries(spacing)) {
    if (isLeafToken(tokenObj)) {
      const size = key;
      css += `.m-${size} { margin: var(--spacing-${size}); }\n`;
      css += `.mx-${size} { margin-left: var(--spacing-${size}); margin-right: var(--spacing-${size}); }\n`;
      css += `.my-${size} { margin-top: var(--spacing-${size}); margin-bottom: var(--spacing-${size}); }\n`;
      css += `.mt-${size} { margin-top: var(--spacing-${size}); }\n`;
      css += `.mr-${size} { margin-right: var(--spacing-${size}); }\n`;
      css += `.mb-${size} { margin-bottom: var(--spacing-${size}); }\n`;
      css += `.ml-${size} { margin-left: var(--spacing-${size}); }\n`;
    }
  }

  // Gap utilities
  css += "\n/* Gap (for Flexbox/Grid) */\n";
  for (const [key, tokenObj] of Object.entries(spacing)) {
    if (isLeafToken(tokenObj)) {
      const size = key;
      css += `.gap-${size} { gap: var(--spacing-${size}); }\n`;
      css += `.gap-x-${size} { column-gap: var(--spacing-${size}); }\n`;
      css += `.gap-y-${size} { row-gap: var(--spacing-${size}); }\n`;
    }
  }

  return css;
}

function generateTypographyUtilities(primitives, semantic) {
  let css = "";

  // Font size utilities from font.size.basic
  if (primitives.font && primitives.font.size && primitives.font.size.basic) {
    css += "/* Font Sizes */\n";
    for (const [key, tokenObj] of Object.entries(primitives.font.size.basic)) {
      if (isLeafToken(tokenObj)) {
        css += `.text-${key} { font-size: var(--font-size-basic-${key}); }\n`;
      }
    }
  }

  // Font weight utilities
  if (primitives.font && primitives.font.weight) {
    css += "\n/* Font Weights */\n";
    for (const [key, tokenObj] of Object.entries(primitives.font.weight)) {
      if (isLeafToken(tokenObj)) {
        css += `.font-${key} { font-weight: var(--font-weight-${key}); }\n`;
      }
    }
  }

  // Line height utilities
  if (primitives.font && primitives.font.leading) {
    css += "\n/* Line Heights */\n";
    for (const [key, tokenObj] of Object.entries(primitives.font.leading)) {
      if (isLeafToken(tokenObj)) {
        css += `.leading-${key} { line-height: var(--font-leading-${key}); }\n`;
      }
    }
  }

  // Font family utilities
  if (primitives.font && primitives.font.family) {
    css += "\n/* Font Families */\n";
    for (const [key, tokenObj] of Object.entries(primitives.font.family)) {
      if (isLeafToken(tokenObj)) {
        css += `.font-${key} { font-family: var(--font-family-${key}); }\n`;
      }
    }
  }

  return css;
}

function generateBorderUtilities(semantic) {
  let css = "";

  // Border radius from components
  if (semantic.button && semantic.button["border-radius"]) {
    css += "/* Border Radius */\n";
    css += `.rounded-button { border-radius: var(--button-border-radius); }\n`;
  }

  if (semantic.input && semantic.input["border-radius"]) {
    css += `.rounded-input { border-radius: var(--input-border-radius); }\n`;
  }

  if (semantic.card && semantic.card["border-radius"]) {
    css += `.rounded-card { border-radius: var(--card-border-radius); }\n`;
  }

  return css;
}

function generateFlexUtilities() {
  let css = "";

  // Display
  css += "/* Display */\n";
  css += ".flex { display: flex; }\n";
  css += ".inline-flex { display: inline-flex; }\n";
  css += ".hidden { display: none; }\n";
  css += ".block { display: block; }\n";
  css += ".inline-block { display: inline-block; }\n";
  css += ".grid { display: grid; }\n";
  css += ".inline-grid { display: inline-grid; }\n";

  // Flex direction
  css += "\n/* Flex Direction */\n";
  css += ".flex-row { flex-direction: row; }\n";
  css += ".flex-row-reverse { flex-direction: row-reverse; }\n";
  css += ".flex-col { flex-direction: column; }\n";
  css += ".flex-col-reverse { flex-direction: column-reverse; }\n";

  // Flex wrap
  css += "\n/* Flex Wrap */\n";
  css += ".flex-wrap { flex-wrap: wrap; }\n";
  css += ".flex-wrap-reverse { flex-wrap: wrap-reverse; }\n";
  css += ".flex-nowrap { flex-wrap: nowrap; }\n";

  // Justify content
  css += "\n/* Justify Content */\n";
  css += ".justify-start { justify-content: flex-start; }\n";
  css += ".justify-end { justify-content: flex-end; }\n";
  css += ".justify-center { justify-content: center; }\n";
  css += ".justify-between { justify-content: space-between; }\n";
  css += ".justify-around { justify-content: space-around; }\n";
  css += ".justify-evenly { justify-content: space-evenly; }\n";

  // Align items
  css += "\n/* Align Items */\n";
  css += ".items-start { align-items: flex-start; }\n";
  css += ".items-end { align-items: flex-end; }\n";
  css += ".items-center { align-items: center; }\n";
  css += ".items-baseline { align-items: baseline; }\n";
  css += ".items-stretch { align-items: stretch; }\n";

  // Align content
  css += "\n/* Align Content */\n";
  css += ".content-start { align-content: flex-start; }\n";
  css += ".content-end { align-content: flex-end; }\n";
  css += ".content-center { align-content: center; }\n";
  css += ".content-between { align-content: space-between; }\n";
  css += ".content-around { align-content: space-around; }\n";
  css += ".content-evenly { align-content: space-evenly; }\n";

  // Align self
  css += "\n/* Align Self */\n";
  css += ".self-auto { align-self: auto; }\n";
  css += ".self-start { align-self: flex-start; }\n";
  css += ".self-end { align-self: flex-end; }\n";
  css += ".self-center { align-self: center; }\n";
  css += ".self-stretch { align-self: stretch; }\n";
  css += ".self-baseline { align-self: baseline; }\n";

  // Flex grow/shrink
  css += "\n/* Flex Grow & Shrink */\n";
  css += ".flex-1 { flex: 1 1 0%; }\n";
  css += ".flex-auto { flex: 1 1 auto; }\n";
  css += ".flex-initial { flex: 0 1 auto; }\n";
  css += ".flex-none { flex: none; }\n";
  css += ".grow { flex-grow: 1; }\n";
  css += ".grow-0 { flex-grow: 0; }\n";
  css += ".shrink { flex-shrink: 1; }\n";
  css += ".shrink-0 { flex-shrink: 0; }\n";

  return css;
}

function generateOpacityUtilities(primitives) {
  let css = "";

  if (!primitives.opacity) {
    return css;
  }

  css += "/* Opacity */\n";
  for (const [key, tokenObj] of Object.entries(primitives.opacity)) {
    if (isLeafToken(tokenObj)) {
      css += `.opacity-${key} { opacity: var(--opacity-${key}); }\n`;
    }
  }

  return css;
}

function generateZIndexUtilities(primitives) {
  let css = "";

  if (!primitives.zIndex) {
    return css;
  }

  css += "/* Z-Index */\n";
  for (const [key, tokenObj] of Object.entries(primitives.zIndex)) {
    if (isLeafToken(tokenObj)) {
      css += `.z-${key} { z-index: var(--zIndex-${key}); }\n`;
    }
  }

  return css;
}

function isLeafToken(obj) {
  return typeof obj === "object" && obj !== null && (obj.$value !== undefined || obj.value !== undefined);
}

function collectTokens(obj, result, prefix) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}-${key}` : key;

    if (isLeafToken(value)) {
      result[currentPath] = value.$value !== undefined ? value.$value : value.value;
    } else if (typeof value === "object" && value !== null) {
      collectTokens(value, result, currentPath);
    }
  }
}

buildUtilities();
