/**
 * Unified Build Script using Style Dictionary
 * Replaces individual build-css.js, build-scss.js, etc.
 */

const StyleDictionary = require('style-dictionary');
const chalk = require('chalk');
const path = require('path');

// Load the configuration
const config = require('../style-dictionary.config.js');

async function build() {
  console.log(chalk.blue('🎨 Building design tokens with Style Dictionary...\n'));

  try {
    // Extend Style Dictionary with our config
    const sd = StyleDictionary.extend(config);

    // Build all platforms
    sd.buildAllPlatforms();

    console.log(chalk.green('\n✓ All token artifacts generated successfully!'));
    console.log(chalk.gray('  Output locations:'));
    console.log(chalk.gray('  - CSS:  dist/css/variables.css'));
    console.log(chalk.gray('  - SCSS: dist/scss/_variables.scss'));
    console.log(chalk.gray('  - JS:   dist/js/tokens.js, tokens.mjs, tokens.d.ts'));
    console.log(chalk.gray('  - JSON: dist/json/tokens.json'));

  } catch (error) {
    console.error(chalk.red('\n✗ Build failed:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the build
build();
