/**
 * Generate Static HTML Preview Site for Design Tokens
 * Creates a visual documentation site showing all tokens
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const TOKENS_DIR = path.join(__dirname, '../tokens');
const OUTPUT_DIR = path.join(__dirname, '../docs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.html');

async function buildPreview() {
  console.log(chalk.blue('🎨 Building token preview site...\n'));

  try {
    await fs.ensureDir(OUTPUT_DIR);

    // Load all tokens
    const primitives = await loadTokens(path.join(TOKENS_DIR, 'primitives'));
    const semantic = await loadTokens(path.join(TOKENS_DIR, 'semantic'));

    // Generate HTML
    const html = generateHTML(primitives, semantic);

    await fs.writeFile(OUTPUT_FILE, html, 'utf-8');

    // Copy CSS files to docs for preview
    await fs.copy(
      path.join(__dirname, '../dist/css/variables.css'),
      path.join(OUTPUT_DIR, 'variables.css')
    );
    
    await fs.copy(
      path.join(__dirname, '../dist/utilities.css'),
      path.join(OUTPUT_DIR, 'utilities.css')
    );

    console.log(chalk.green('✓ Token preview site generated:'), OUTPUT_FILE);
    console.log(chalk.gray('  Open docs/index.html in your browser to view'));
  } catch (error) {
    console.error(chalk.red('✗ Error building preview:'), error.message);
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

function generateHTML(primitives, semantic) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kami Design Tokens - Visual Reference</title>
  <link rel="stylesheet" href="variables.css">
  <link rel="stylesheet" href="utilities.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: var(--color-text, #333);
      background-color: var(--color-background, #fff);
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--color-border, #e0e0e0);
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--color-primary, #2196f3);
    }

    h2 {
      font-size: 2rem;
      font-weight: 600;
      margin: 3rem 0 1.5rem;
      color: var(--color-text, #333);
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 2rem 0 1rem;
      color: var(--color-text-secondary, #666);
    }

    .subtitle {
      font-size: 1.125rem;
      color: var(--color-text-secondary, #666);
    }

    .section {
      margin-bottom: 4rem;
    }

    /* Color Swatches */
    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .color-card {
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .color-swatch {
      height: 120px;
      width: 100%;
    }

    .color-info {
      padding: 1rem;
      background: white;
    }

    .color-name {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
      color: #333;
    }

    .color-value {
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      color: #666;
    }

    /* Typography Specimens */
    .type-specimen {
      padding: 1.5rem;
      margin: 1rem 0;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      background: white;
    }

    .type-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary, #999);
      margin-bottom: 0.5rem;
    }

    /* Spacing Visualization */
    .spacing-grid {
      display: grid;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .spacing-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .spacing-label {
      min-width: 100px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .spacing-visual {
      height: 40px;
      background: linear-gradient(135deg, var(--color-primary, #2196f3), var(--color-primary-hover, #1976d2));
      border-radius: 4px;
    }

    .spacing-value {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      color: #666;
    }

    /* Component Examples */
    .component-grid {
      display: grid;
      gap: 2rem;
      margin-top: 1.5rem;
    }

    .component-demo {
      padding: 2rem;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      background: var(--color-background-secondary, #fafafa);
    }

    .demo-button {
      display: inline-block;
      padding: var(--button-padding-y, 0.5rem) var(--button-padding-x, 1rem);
      background-color: var(--color-primary, #2196f3);
      color: white;
      border: none;
      border-radius: var(--button-border-radius, 4px);
      font-size: var(--button-font-size, 1rem);
      font-weight: var(--button-font-weight, 500);
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .demo-button:hover {
      background-color: var(--color-primary-hover, #1976d2);
    }

    .demo-input {
      width: 100%;
      padding: var(--input-padding-y, 0.5rem) var(--input-padding-x, 1rem);
      border: var(--input-border-width, 1px) solid var(--color-border, #e0e0e0);
      border-radius: var(--input-border-radius, 4px);
      font-size: var(--input-font-size, 1rem);
    }

    .demo-card {
      padding: var(--card-padding, 1.5rem);
      background: white;
      border-radius: var(--card-border-radius, 8px);
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }

      h1 {
        font-size: 2rem;
      }

      .color-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎨 Kami Design Tokens</h1>
      <p class="subtitle">Visual Reference & Documentation</p>
    </header>

    ${generateColorSection(primitives, semantic)}
    ${generateTypographySection(primitives)}
    ${generateSpacingSection(primitives)}
    ${generateComponentSection(semantic)}

    <footer style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--color-border, #e0e0e0); text-align: center; color: var(--color-text-secondary, #666);">
      <p>Generated: ${new Date().toISOString()}</p>
      <p style="margin-top: 0.5rem;">
        <a href="https://github.com/kamishino/design-tokens" style="color: var(--color-primary, #2196f3);">View on GitHub</a>
      </p>
    </footer>
  </div>
</body>
</html>`;
}

function generateColorSection(primitives, semantic) {
  let html = '<section class="section">\n';
  html += '  <h2>Colors</h2>\n';

  // Primitive Colors
  if (primitives.color) {
    html += '  <h3>Primitives</h3>\n';
    html += '  <div class="color-grid">\n';
    
    const colors = flattenColors(primitives.color);
    for (const [name, value] of Object.entries(colors)) {
      const varName = `--color-${name.replace(/\./g, '-')}`;
      const displayValue = value.$value || value;
      
      html += `    <div class="color-card">
      <div class="color-swatch" style="background-color: ${displayValue};"></div>
      <div class="color-info">
        <div class="color-name">${name}</div>
        <div class="color-value">${displayValue}</div>
        <div class="color-value" style="margin-top: 0.25rem;">${varName}</div>
      </div>
    </div>\n`;
    }
    
    html += '  </div>\n';
  }

  // Semantic Colors
  if (semantic.color) {
    html += '  <h3>Semantic</h3>\n';
    html += '  <div class="color-grid">\n';
    
    const colors = flattenColors(semantic.color);
    for (const [name, value] of Object.entries(colors)) {
      const varName = `--color-${name.replace(/\./g, '-')}`;
      const displayValue = value.$value || value;
      
      html += `    <div class="color-card">
      <div class="color-swatch" style="background-color: var(${varName});"></div>
      <div class="color-info">
        <div class="color-name">${name}</div>
        <div class="color-value">${displayValue}</div>
        <div class="color-value" style="margin-top: 0.25rem;">${varName}</div>
      </div>
    </div>\n`;
    }
    
    html += '  </div>\n';
  }

  html += '</section>\n';
  return html;
}

function generateTypographySection(primitives) {
  let html = '<section class="section">\n';
  html += '  <h2>Typography</h2>\n';

  if (primitives.fontSize) {
    html += '  <h3>Font Sizes</h3>\n';
    
    for (const [key, value] of Object.entries(primitives.fontSize)) {
      const size = value.$value || value;
      html += `  <div class="type-specimen">
    <div class="type-label">fontSize-${key} (${size})</div>
    <div style="font-size: var(--fontSize-${key});">
      The quick brown fox jumps over the lazy dog
    </div>
  </div>\n`;
    }
  }

  if (primitives.fontWeight) {
    html += '  <h3>Font Weights</h3>\n';
    
    for (const [key, value] of Object.entries(primitives.fontWeight)) {
      const weight = value.$value || value;
      html += `  <div class="type-specimen">
    <div class="type-label">fontWeight-${key} (${weight})</div>
    <div style="font-weight: var(--fontWeight-${key}); font-size: 1.25rem;">
      The quick brown fox jumps over the lazy dog
    </div>
  </div>\n`;
    }
  }

  html += '</section>\n';
  return html;
}

function generateSpacingSection(primitives) {
  let html = '<section class="section">\n';
  html += '  <h2>Spacing</h2>\n';

  if (primitives.spacing) {
    html += '  <div class="spacing-grid">\n';
    
    for (const [key, value] of Object.entries(primitives.spacing)) {
      const size = value.$value || value;
      html += `    <div class="spacing-item">
      <div class="spacing-label">spacing-${key}</div>
      <div class="spacing-visual" style="width: var(--spacing-${key});"></div>
      <div class="spacing-value">${size}</div>
    </div>\n`;
    }
    
    html += '  </div>\n';
  }

  html += '</section>\n';
  return html;
}

function generateComponentSection(semantic) {
  let html = '<section class="section">\n';
  html += '  <h2>Component Examples</h2>\n';
  html += '  <div class="component-grid">\n';

  if (semantic.button) {
    html += `    <div class="component-demo">
      <h3>Button</h3>
      <button class="demo-button">Primary Button</button>
      <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-text-secondary);">
        Uses button tokens: padding, border-radius, font-size, font-weight
      </div>
    </div>\n`;
  }

  if (semantic.input) {
    html += `    <div class="component-demo">
      <h3>Input</h3>
      <input type="text" class="demo-input" placeholder="Enter text...">
      <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-text-secondary);">
        Uses input tokens: padding, border-radius, border-width, font-size
      </div>
    </div>\n`;
  }

  if (semantic.card) {
    html += `    <div class="component-demo">
      <h3>Card</h3>
      <div class="demo-card">
        <h4 style="margin-bottom: 0.5rem;">Card Title</h4>
        <p>This card demonstrates the card tokens including padding, border-radius, and shadow.</p>
      </div>
    </div>\n`;
  }

  html += '  </div>\n';
  html += '</section>\n';
  return html;
}

function flattenColors(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      if (value.$value !== undefined) {
        result[currentPath] = value;
      } else {
        Object.assign(result, flattenColors(value, currentPath));
      }
    } else {
      result[currentPath] = value;
    }
  }
  
  return result;
}

buildPreview();
