/**
 * Build Design Tokens using Style Dictionary
 * Generates CSS, SCSS, JavaScript, and JSON artifacts
 * Supports multi-theme builds
 */

import StyleDictionary from "style-dictionary";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the base configuration
const baseConfig = (await import("../style-dictionary.config.js")).default;

async function buildTokens() {
  console.log(chalk.blue('🎨 Building design tokens...\n'));

  try {
    // Build base tokens (primitives + semantic)
    console.log(chalk.gray('Building base tokens...'));
    const sd = StyleDictionary.extend(baseConfig);
    await sd.buildAllPlatforms();
    console.log(chalk.green('✓ Base tokens built\n'));

    // Check for themes and build them
    const themesDir = path.join(__dirname, '../tokens/themes');
    
    if (await fs.pathExists(themesDir)) {
      const themeFiles = await fs.readdir(themesDir);
      const jsonThemes = themeFiles.filter(f => f.endsWith('.json'));
      
      if (jsonThemes.length > 0) {
        console.log(chalk.gray('Found ' + jsonThemes.length + ' theme(s), building...\n'));
        
        for (const themeFile of jsonThemes) {
          const themeName = path.basename(themeFile, '.json');
          await buildTheme(themeName);
        }
      }
    }

    console.log(chalk.green('\n✓ All design tokens built successfully!'));
    console.log(chalk.gray('  Check the dist/ directory for generated files'));
  } catch (error) {
    console.error(chalk.red('✗ Build failed:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function buildTheme(themeName) {
  console.log(chalk.gray('Building theme: ' + themeName + '...'));
  
  const themeConfig = {
    source: [
      "tokens/primitives/**/*.json",
      "tokens/themes/" + themeName + ".json",
    ],
    platforms: {
      css: {
        transformGroup: "css",
        buildPath: "dist/css/",
        files: [
          {
            destination: "theme-" + themeName + ".css",
            format: "css/theme-separated",
            options: {
              themeName: themeName,
              selector: '[data-theme="' + themeName + '"]',
              outputReferences: true,
            },
          },
        ],
      },
      scss: {
        transformGroup: "scss",
        buildPath: "dist/scss/",
        files: [
          {
            destination: "theme-" + themeName + ".scss",
            format: "scss/theme-map-separated",
            options: {
              themeName: themeName,
            },
          },
        ],
      },
      json: {
        transformGroup: "js",
        buildPath: "dist/json/",
        files: [
          {
            destination: "theme-" + themeName + ".json",
            format: "json/nested",
          },
        ],
      },
    },
  };

  const sd = StyleDictionary.extend(themeConfig);
  await sd.buildAllPlatforms();
  
  console.log(chalk.green('✓ Theme "' + themeName + '" built'));
}

buildTokens();
