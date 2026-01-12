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

const TOKENS_DIR = path.join(__dirname, '../tokens');
const OUTPUT_FILE = path.join(__dirname, '../dist/utilities.css');

async function buildUtilities() {
  console.log(chalk.blue('🎨 Building utility classes...\n'));

  try {
    await fs.ensureDir(path.dirname(OUTPUT_FILE));

    // Load all tokens
    const primitives = await loadTokens(path.join(TOKENS_DIR, 'primitives'));
    const semantic = await loadTokens(path.join(TOKENS_DIR, 'semantic'));

    let css = '/* Generated Utility Classes - DO NOT EDIT MANUALLY */\n';
    css += '/* Last updated: ' + new Date().toISOString() + ' */\n\n';

    // Generate color utilities
    css += '/* ========== Color Utilities ========== */\n\n';
    css += generateColorUtilities(primitives, semantic);

    // Generate spacing utilities
    css += '\n/* ========== Spacing Utilities ========== */\n\n';
    css += generateSpacingUtilities(primitives, semantic);

    // Generate typography utilities
    css += '\n/* ========== Typography Utilities ========== */\n\n';
    css += generateTypographyUtilities(primitives, semantic);

    // Generate border utilities
    css += '\n/* ========== Border Utilities ========== */\n\n';
    css += generateBorderUtilities(semantic);

    await fs.writeFile(OUTPUT_FILE, css, 'utf-8');

    console.log(chalk.green('✓ Utility classes generated:'), OUTPUT_FILE);
  } catch (error) {
    console.error(chalk.red('✗ Error building utilities:'), error.message);
    process.exit(1);
  }
}

async function loadTokens(dir) {
  const tokens = {};
  
  if (!await fs.pathExists(dir)) {
    return tokens;
  }

  const files = await fs.readdir(dir);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(dir, file);
      const content = await fs.readJSON(filePath);
      Object.assign(tokens, content);
    }
  }
  
  return tokens;
}

function generateColorUtilities(primitives, semantic) {
  let css = '';
  const colors = {};

  // Collect all color tokens
  collectColors(primitives.color || {}, colors, '');
  collectColors(semantic.color || {}, colors, '');

  // Generate background color utilities
  css += '/* Background Colors */\n';
  for (const [name, value] of Object.entries(colors)) {
    const className = name.replace(/\./g, '-');
    css += `.bg-${className} { background-color: var(--color-${className}); }\n`;
  }

  css += '\n/* Text Colors */\n';
  for (const [name, value] of Object.entries(colors)) {
    const className = name.replace(/\./g, '-');
    css += `.text-${className} { color: var(--color-${className}); }\n`;
  }

  css += '\n/* Border Colors */\n';
  for (const [name, value] of Object.entries(colors)) {
    const className = name.replace(/\./g, '-');
    css += `.border-${className} { border-color: var(--color-${className}); }\n`;
  }

  return css;
}

function generateSpacingUtilities(primitives, semantic) {
  let css = '';
  const spacing = primitives.spacing || {};

  // Padding utilities
  css += '/* Padding */\n';
  for (const [key, value] of Object.entries(spacing)) {
    const size = key;
    css += `.p-${size} { padding: var(--spacing-${size}); }\n`;
    css += `.px-${size} { padding-left: var(--spacing-${size}); padding-right: var(--spacing-${size}); }\n`;
    css += `.py-${size} { padding-top: var(--spacing-${size}); padding-bottom: var(--spacing-${size}); }\n`;
    css += `.pt-${size} { padding-top: var(--spacing-${size}); }\n`;
    css += `.pr-${size} { padding-right: var(--spacing-${size}); }\n`;
    css += `.pb-${size} { padding-bottom: var(--spacing-${size}); }\n`;
    css += `.pl-${size} { padding-left: var(--spacing-${size}); }\n`;
  }

  // Margin utilities
  css += '\n/* Margin */\n';
  for (const [key, value] of Object.entries(spacing)) {
    const size = key;
    css += `.m-${size} { margin: var(--spacing-${size}); }\n`;
    css += `.mx-${size} { margin-left: var(--spacing-${size}); margin-right: var(--spacing-${size}); }\n`;
    css += `.my-${size} { margin-top: var(--spacing-${size}); margin-bottom: var(--spacing-${size}); }\n`;
    css += `.mt-${size} { margin-top: var(--spacing-${size}); }\n`;
    css += `.mr-${size} { margin-right: var(--spacing-${size}); }\n`;
    css += `.mb-${size} { margin-bottom: var(--spacing-${size}); }\n`;
    css += `.ml-${size} { margin-left: var(--spacing-${size}); }\n`;
  }

  // Gap utilities
  css += '\n/* Gap (for Flexbox/Grid) */\n';
  for (const [key, value] of Object.entries(spacing)) {
    const size = key;
    css += `.gap-${size} { gap: var(--spacing-${size}); }\n`;
  }

  return css;
}

function generateTypographyUtilities(primitives, semantic) {
  let css = '';

  // Font size utilities
  if (primitives.fontSize) {
    css += '/* Font Sizes */\n';
    for (const [key, value] of Object.entries(primitives.fontSize)) {
      css += `.text-${key} { font-size: var(--fontSize-${key}); }\n`;
    }
  }

  // Font weight utilities
  if (primitives.fontWeight) {
    css += '\n/* Font Weights */\n';
    for (const [key, value] of Object.entries(primitives.fontWeight)) {
      css += `.font-${key} { font-weight: var(--fontWeight-${key}); }\n`;
    }
  }

  // Line height utilities
  if (primitives.lineHeight) {
    css += '\n/* Line Heights */\n';
    for (const [key, value] of Object.entries(primitives.lineHeight)) {
      css += `.leading-${key} { line-height: var(--lineHeight-${key}); }\n`;
    }
  }

  return css;
}

function generateBorderUtilities(semantic) {
  let css = '';

  // Border radius from components
  if (semantic.button && semantic.button['border-radius']) {
    css += '/* Border Radius */\n';
    css += `.rounded-button { border-radius: var(--button-border-radius); }\n`;
  }

  if (semantic.input && semantic.input['border-radius']) {
    css += `.rounded-input { border-radius: var(--input-border-radius); }\n`;
  }

  if (semantic.card && semantic.card['border-radius']) {
    css += `.rounded-card { border-radius: var(--card-border-radius); }\n`;
  }

  return css;
}

function collectColors(obj, result, prefix) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      if (value.$value !== undefined) {
        result[currentPath] = value.$value;
      } else {
        collectColors(value, result, currentPath);
      }
    } else {
      result[currentPath] = value;
    }
  }
}

buildUtilities();
