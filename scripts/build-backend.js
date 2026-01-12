/**
 * Backend Artifact Generator
 * Generates flat JSON files for backend validation and rendering
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const DIST_JSON_DIR = path.join(__dirname, '../dist/json');

/**
 * Flatten nested token object into dot notation
 * @param {Object} obj - Token object to flatten
 * @param {string} prefix - Current path prefix
 * @returns {Object} - Flattened object with dot notation keys
 */
function flattenTokens(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object') {
      // Check if this is a token (has value or $value property)
      if (value.value !== undefined || value.$value !== undefined) {
        result[newKey] = value.value || value.$value;
      } else {
        // Recurse for nested objects
        Object.assign(result, flattenTokens(value, newKey));
      }
    } else {
      // Primitive value
      result[newKey] = value;
    }
  }
  
  return result;
}

/**
 * Generate backend artifacts
 */
async function buildBackendArtifacts() {
  console.log(chalk.blue('🔧 Building backend artifacts...\n'));

  try {
    // Ensure dist/json directory exists
    await fs.ensureDir(DIST_JSON_DIR);

    // Read the generated tokens.json (already resolved by Style Dictionary)
    const tokensPath = path.join(DIST_JSON_DIR, "tokens.json");

    if (!(await fs.pathExists(tokensPath))) {
      throw new Error("tokens.json not found. Run build:tokens first.");
    }

    const tokens = await fs.readJSON(tokensPath);

    // Flatten the tokens
    const flatTokens = flattenTokens(tokens);

    // Generate token-names.json (array of valid token keys)
    const tokenNames = Object.keys(flatTokens).sort();
    const namesPath = path.join(DIST_JSON_DIR, "token-names.json");
    await fs.writeJSON(namesPath, tokenNames, { spaces: 2 });
    console.log(chalk.green(`✔︎ ${path.relative(process.cwd(), namesPath)}`));
    console.log(chalk.gray(`  Generated ${tokenNames.length} token names\n`));

    // Generate token-values.json (flat object mapping keys to values)
    // Sort keys alphabetically for better organization and cleaner diffs
    const sortedTokens = Object.keys(flatTokens)
      .sort()
      .reduce((obj, key) => {
        obj[key] = flatTokens[key];
        return obj;
      }, {});

    const valuesPath = path.join(DIST_JSON_DIR, "token-values.json");
    await fs.writeJSON(valuesPath, sortedTokens, { spaces: 2 });
    console.log(chalk.green(`✔︎ ${path.relative(process.cwd(), valuesPath)}`));
    console.log(
      chalk.gray(`  Generated ${Object.keys(flatTokens).length} token values\n`)
    );

    console.log(chalk.green("✓ Backend artifacts built successfully!\n"));

    // Display sample output
    console.log(chalk.gray("Sample token names:"));
    tokenNames.slice(0, 5).forEach((name) => {
      console.log(chalk.gray(`  - ${name}`));
    });
    console.log(chalk.gray(`  ... and ${tokenNames.length - 5} more\n`));

    console.log(chalk.gray("Sample token values:"));
    Object.entries(flatTokens)
      .slice(0, 5)
      .forEach(([key, value]) => {
        console.log(chalk.gray(`  ${key}: ${value}`));
      });
    console.log(
      chalk.gray(`  ... and ${Object.keys(flatTokens).length - 5} more\n`)
    );
  } catch (error) {
    console.error(chalk.red('✗ Backend build failed:'), error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildBackendArtifacts();
}

module.exports = buildBackendArtifacts;
