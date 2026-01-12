/**
 * Optimize Tokens for Figma Token Studio
 * Enriches tokens with scoping metadata and generates $themes.json
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
const OUTPUT_DIR = path.join(__dirname, "../dist/figma");

// Scope mappings for different token types
const SCOPE_MAPPINGS = {
  "radius.json": "borderRadius",
  "spacing.json": "spacing",
  "colors.json": "color",
  "typography.json": "fontSizes",
  "breakpoints.json": "sizing",
  "grid.json": "mixed", // Requires special handling, see injectScopes
};

/**
 * Inject scoping metadata into tokens
 */
function injectScopes(content, fileName, scope) {
  if (!scope) return content;

  const enriched = JSON.parse(JSON.stringify(content));

  // Special handling for grid.json with mixed scopes
  if (fileName === "grid.json" && scope === "mixed") {
    return injectGridScopes(enriched);
  }

  function addScopeToTokens(obj) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        // Check if this is a token (has $value or value property)
        if (value.$value !== undefined || (value.value !== undefined && value.$type)) {
          // Add $extensions if not present
          if (!value.$extensions) {
            value.$extensions = {};
          }
          if (!value.$extensions.studio) {
            value.$extensions.studio = {};
          }
          // Only add scope if not already present
          if (!value.$extensions.studio.scope) {
            value.$extensions.studio.scope = scope;
          }
        } else {
          // Recurse for nested objects
          addScopeToTokens(value);
        }
      }
    }
  }

  addScopeToTokens(enriched);
  return enriched;
}

/**
 * Inject specific scopes for grid tokens
 * - gutter -> spacing
 * - container, container-fluid -> sizing
 * - columns -> other
 */
function injectGridScopes(content) {
  const enriched = JSON.parse(JSON.stringify(content));

  function addScopeToGridTokens(obj, keyPath = []) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        const currentPath = [...keyPath, key];

        // Check if this is a token (has $value or value property)
        if (value.$value !== undefined || (value.value !== undefined && value.$type)) {
          // Determine scope based on key path
          let tokenScope = "other"; // default

          // Check if path contains specific keys
          if (currentPath.includes("gutter")) {
            tokenScope = "spacing";
          } else if (currentPath.includes("container") || currentPath.includes("container-fluid") || currentPath.includes("padding")) {
            tokenScope = "sizing";
          } else if (currentPath.includes("columns")) {
            tokenScope = "other";
          }

          // Add $extensions
          if (!value.$extensions) {
            value.$extensions = {};
          }
          if (!value.$extensions.studio) {
            value.$extensions.studio = {};
          }
          if (!value.$extensions.studio.scope) {
            value.$extensions.studio.scope = tokenScope;
          }
        } else {
          // Recurse for nested objects
          addScopeToGridTokens(value, currentPath);
        }
      }
    }
  }

  addScopeToGridTokens(enriched);
  return enriched;
}

/**
 * Copy and enrich token files
 */
async function processTokenFiles(sourceDir, outputDir, relativePath = "") {
  const files = await fs.readdir(sourceDir, { withFileTypes: true });
  const tokenSets = [];

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file.name);
    const outputPath = path.join(outputDir, file.name);
    const setPath = relativePath ? `${relativePath}/${file.name}` : file.name;

    if (file.isDirectory()) {
      // Recursively process subdirectories
      await fs.ensureDir(outputPath);
      const subSets = await processTokenFiles(sourcePath, outputPath, setPath);
      tokenSets.push(...subSets);
    } else if (file.name.endsWith(".json") && file.name !== "schema.json") {
      // Read and process token file
      const content = await fs.readJSON(sourcePath);

      // Check if this file needs scoping
      const scope = SCOPE_MAPPINGS[file.name];
      const enriched = injectScopes(content, file.name, scope);

      // Write enriched tokens
      await fs.writeJSON(outputPath, enriched, { spaces: 2 });

      // Add to token sets list (without .json extension)
      const setName = setPath.replace(".json", "");
      tokenSets.push(setName);

      console.log(chalk.gray(`  ✓ ${setPath}${scope ? ` (scope: ${scope})` : ""}`));
    }
  }

  return tokenSets;
}

/**
 * Generate $themes.json metadata
 */
async function generateThemesConfig(tokenSets) {
  const themes = [];

  // Get list of theme files
  const themesDir = path.join(TOKENS_DIR, "themes");
  let themeFiles = [];

  if (await fs.pathExists(themesDir)) {
    const files = await fs.readdir(themesDir);
    themeFiles = files.filter((f) => f.endsWith(".json"));
  }

  // Create a theme configuration for each theme (or default if no themes)
  if (themeFiles.length === 0) {
    // Default theme with all primitives and semantic enabled
    const selectedTokenSets = {};

    tokenSets.forEach((setName) => {
      // Enable primitives and semantic, disable themes
      if (setName.startsWith("primitives/") || setName.startsWith("semantic/")) {
        selectedTokenSets[setName] = "enabled";
      }
    });

    themes.push({
      id: "default",
      name: "Default Theme",
      selectedTokenSets,
    });
  } else {
    // Create configuration for each theme
    for (const themeFile of themeFiles) {
      const themeName = path.basename(themeFile, ".json");
      const selectedTokenSets = {};

      tokenSets.forEach((setName) => {
        if (setName.startsWith("primitives/")) {
          selectedTokenSets[setName] = "enabled";
        } else if (setName.startsWith("semantic/")) {
          selectedTokenSets[setName] = "enabled";
        } else if (setName === `themes/${themeName}`) {
          selectedTokenSets[setName] = "enabled";
        } else if (setName.startsWith("themes/")) {
          selectedTokenSets[setName] = "disabled";
        }
      });

      themes.push({
        id: themeName,
        name: themeName.charAt(0).toUpperCase() + themeName.slice(1),
        selectedTokenSets,
      });
    }
  }

  return themes;
}

/**
 * Main optimization function
 */
async function optimizeForFigma() {
  console.log(chalk.blue("🎨 Optimizing tokens for Figma Token Studio...\n"));

  try {
    // Clean output directory
    await fs.emptyDir(OUTPUT_DIR);
    console.log(chalk.gray("Cleaned dist/figma/ directory\n"));

    // Process all token files
    console.log(chalk.gray("Processing token files:"));
    const tokenSets = await processTokenFiles(TOKENS_DIR, OUTPUT_DIR);

    console.log(chalk.gray(`\nProcessed ${tokenSets.length} token sets\n`));

    // Generate $themes.json
    console.log(chalk.gray("Generating $themes.json..."));
    const themes = await generateThemesConfig(tokenSets);
    const themesPath = path.join(OUTPUT_DIR, "$themes.json");
    await fs.writeJSON(themesPath, themes, { spaces: 2 });

    console.log(chalk.green(`✓ Created $themes.json with ${themes.length} theme(s)`));
    themes.forEach((theme) => {
      const enabledCount = Object.values(theme.selectedTokenSets).filter((v) => v === "enabled").length;
      console.log(chalk.gray(`  - ${theme.name}: ${enabledCount} sets enabled`));
    });

    console.log(chalk.green("\n✅ Figma optimization complete!"));
    console.log(chalk.gray(`  Output: ${path.relative(process.cwd(), OUTPUT_DIR)}`));
    console.log(chalk.gray("  Designers can now import this folder into Token Studio"));
  } catch (error) {
    console.error(chalk.red("✗ Optimization failed:"), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run optimization
optimizeForFigma();
