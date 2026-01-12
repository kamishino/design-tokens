/**
 * Accessibility Contrast Checker
 * Verifies WCAG AA compliance for semantic token pairings
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Load token files
const primitivesPath = path.join(__dirname, '../tokens/primitives/colors.json');
const semanticPath = path.join(__dirname, '../tokens/semantic/colors.json');

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate relative luminance
function getLuminance(rgb) {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(hexToRgb(color1));
  const lum2 = getLuminance(hexToRgb(color2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Resolve token reference to actual hex value
function resolveToken(reference, primitives) {
  // Remove curly braces and split path
  const path = reference.replace(/[{}]/g, '').split('.');
  
  let current = primitives;
  for (const key of path) {
    if (current[key] !== undefined) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  return current.value || current.$value || current;
}

async function checkContrast() {
  console.log(chalk.blue('🎨 Checking color contrast ratios...\n'));

  try {
    const primitives = await fs.readJSON(primitivesPath);
    const semantic = await fs.readJSON(semanticPath);

    const checks = [
      {
        name: 'Text Primary on Canvas',
        foreground: semantic.text.primary.value,
        background: semantic.bg.canvas.value,
        minRatio: 4.5
      },
      {
        name: 'Text Secondary on Canvas',
        foreground: semantic.text.secondary.value,
        background: semantic.bg.canvas.value,
        minRatio: 4.5
      },
      {
        name: 'Primary Action Button',
        foreground: semantic.action['primary-text'].value,
        background: semantic.action['primary-bg'].value,
        minRatio: 4.5
      },
      {
        name: 'Success Message',
        foreground: semantic.status['success-text'].value,
        background: semantic.status['success-bg'].value,
        minRatio: 4.5
      },
      {
        name: 'Warning Message',
        foreground: semantic.status['warning-text'].value,
        background: semantic.status['warning-bg'].value,
        minRatio: 4.5
      },
      {
        name: 'Error Message',
        foreground: semantic.status['error-text'].value,
        background: semantic.status['error-bg'].value,
        minRatio: 4.5
      },
      {
        name: 'Info Message',
        foreground: semantic.status['info-text'].value,
        background: semantic.status['info-bg'].value,
        minRatio: 4.5
      },
      {
        name: 'Text on Brand',
        foreground: semantic.text['on-brand'].value,
        background: semantic.brand.primary.value,
        minRatio: 4.5
      }
    ];

    let passCount = 0;
    let failCount = 0;
    const results = [];

    for (const check of checks) {
      const fgHex = resolveToken(check.foreground, primitives);
      const bgHex = resolveToken(check.background, primitives);

      if (!fgHex || !bgHex) {
        console.log(chalk.red(`✗ ${check.name}: Could not resolve tokens`));
        failCount++;
        continue;
      }

      const ratio = getContrastRatio(fgHex, bgHex);
      const passes = ratio >= check.minRatio;

      results.push({
        name: check.name,
        ratio: ratio.toFixed(2),
        minRatio: check.minRatio,
        passes,
        foreground: fgHex,
        background: bgHex
      });

      if (passes) {
        console.log(
          chalk.green(`✓ ${check.name}: ${ratio.toFixed(2)}:1`) +
          chalk.gray(` (${fgHex} on ${bgHex})`)
        );
        passCount++;
      } else {
        console.log(
          chalk.red(`✗ ${check.name}: ${ratio.toFixed(2)}:1 - FAILS WCAG AA`) +
          chalk.gray(` (needs ${check.minRatio}:1)`)
        );
        failCount++;
      }
    }

    console.log('\n' + chalk.blue('Summary:'));
    console.log(chalk.green(`  Passed: ${passCount}`));
    console.log(chalk.red(`  Failed: ${failCount}`));

    if (failCount > 0) {
      console.log('\n' + chalk.yellow('⚠ Some contrast ratios do not meet WCAG AA standards.'));
      console.log(chalk.yellow('  Consider adjusting the semantic token mappings.'));
      process.exit(1);
    } else {
      console.log('\n' + chalk.green('✓ All contrast ratios meet WCAG AA standards!'));
      process.exit(0);
    }

  } catch (error) {
    console.error(chalk.red('✗ Error checking contrast:'), error.message);
    process.exit(1);
  }
}

checkContrast();
