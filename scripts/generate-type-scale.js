/**
 * Dynamic Type Scale Generator
 * Generates font size tokens based on modular scale ratio
 * Runs before Style Dictionary to ensure font sizes are calculated dynamically
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TYPOGRAPHY_PATH = path.join(__dirname, "../tokens/primitives/typography.json");
const SCALE_PATH = path.join(__dirname, "../tokens/primitives/scale.json");
const SEMANTIC_TYPOGRAPHY_PATH = path.join(__dirname, "../tokens/semantic/typography.json");
const GENERATED_SCALE_PATH = path.join(__dirname, "../tokens/generated/typography-scale.json");

/**
 * Resolve a token reference to its actual value
 * @param {string} reference - Token reference like "{scale.major-third}"
 * @param {Object} scaleData - Scale data object from scale.json
 * @returns {number} - Resolved numeric value
 */
function resolveRatio(reference, scaleData) {
  // Parse reference string like "{scale.major-third}"
  const match = reference.match(/\{scale\.([^}]+)\}/);

  if (!match) {
    throw new Error(`Invalid reference format: ${reference}. Expected format: {scale.xxx}`);
  }

  const scaleName = match[1];

  if (!scaleData.scale[scaleName]) {
    throw new Error(`Scale ratio "${scaleName}" not found in scale.json`);
  }

  return parseFloat(scaleData.scale[scaleName].value);
}

/**
 * Calculate modular scale font sizes for content hierarchy
 * @param {number} baseSize - Base font size in pixels
 * @param {number} ratio - Scale ratio (e.g., 1.25 for Major Third)
 * @returns {Object} - Calculated modular scale sizes
 */
function calculateModularScale(baseSize, ratio) {
  // Define modular scale steps (-2 to 8 for complete typography hierarchy)
  // Negative steps: Small text, captions
  // Step 0: Base size
  // Positive steps: Headings, display text, and content typography
  const steps = {
    "-2": -2, // base * ratio^-2 (Small print)
    "-1": -1, // base * ratio^-1 (Caption text)
    0: 0, // base * ratio^0 (Base/body text)
    1: 1, // base * ratio^1 (H6 level)
    2: 2, // base * ratio^2 (H5 level)
    3: 3, // base * ratio^3 (H4 level)
    4: 4, // base * ratio^4 (H3 level)
    5: 5, // base * ratio^5 (H2 level)
    6: 6, // base * ratio^6 (H1 level)
    7: 7, // base * ratio^7 (Display level)
    8: 8, // base * ratio^8 (Hero level)
  };

  const calculatedSizes = {};

  for (const [name, step] of Object.entries(steps)) {
    const size = baseSize * Math.pow(ratio, step);
    calculatedSizes[name] = Math.round(size);
  }

  return calculatedSizes;
}

/**
 * Generate typography tokens with calculated sizes
 */
async function generateTypeScale() {
  console.log(chalk.blue("📐 Generating dynamic type scale...\n"));

  try {
    // Read existing typography file
    if (!(await fs.pathExists(TYPOGRAPHY_PATH))) {
      throw new Error("typography.json not found");
    }

    const typography = await fs.readJSON(TYPOGRAPHY_PATH);

    // Read scale ratios
    if (!(await fs.pathExists(SCALE_PATH))) {
      throw new Error("scale.json not found");
    }

    const scaleData = await fs.readJSON(SCALE_PATH);

    // Get base font size from basic.base (should be 16px by default)
    const baseSize = parseInt(typography.font.size.basic.base.value) || 16;

    // Read semantic typography config to get the configured ratio
    let ratio = 1.25; // Default fallback
    let ratioReference = "{scale.major-third}"; // Default reference

    if (await fs.pathExists(SEMANTIC_TYPOGRAPHY_PATH)) {
      const semanticTypography = await fs.readJSON(SEMANTIC_TYPOGRAPHY_PATH);

      if (semanticTypography.typography?.config?.["scale-ratio"]?.value) {
        ratioReference = semanticTypography.typography.config["scale-ratio"].value;
        ratio = resolveRatio(ratioReference, scaleData);
      }
    } else {
      console.log(chalk.yellow("⚠ Semantic typography config not found, using default ratio"));
    }

    console.log(chalk.gray(`Base size: ${baseSize}px (from font.size.basic.base)`));
    console.log(chalk.gray(`Scale ratio: ${ratio} (${getRatioName(ratio, scaleData)})`));
    console.log(chalk.gray(`Configured via: ${ratioReference}`));
    console.log("");

    // Calculate modular scale sizes
    const calculatedSizes = calculateModularScale(baseSize, ratio);

    // Update only the scale section (preserve root and basic)
    const scaleObject = {
      $description: "Modular scale sizes for content hierarchy - generated dynamically from scale.json ratio",
    };

    for (const [step, size] of Object.entries(calculatedSizes)) {
      scaleObject[step] = {
        value: `${size}px`,
        $type: "fontSizes",
        $description: `Step ${step}: ${baseSize}px × ${ratio}^${step} = ${size}px`,
      };
    }

    // Create generated file structure (only scale, not modifying source)
    const generatedContent = {
      font: {
        size: {
          scale: scaleObject,
        },
      },
    };

    // Diff check: only write if content has changed
    let shouldWrite = true;
    if (await fs.pathExists(GENERATED_SCALE_PATH)) {
      const existingContent = await fs.readJSON(GENERATED_SCALE_PATH);
      if (JSON.stringify(existingContent) === JSON.stringify(generatedContent)) {
        shouldWrite = false;
        console.log(chalk.gray("✓ No changes detected, skipping write\n"));
      }
    }

    if (shouldWrite) {
      // Ensure generated directory exists
      await fs.ensureDir(path.dirname(GENERATED_SCALE_PATH));

      // Write to generated directory (not source)
      await fs.writeJSON(GENERATED_SCALE_PATH, generatedContent, { spaces: 2 });
      console.log(chalk.green("✓ Modular scale generated:\n"));
    } else {
      console.log(chalk.green("✓ Modular scale up-to-date:\n"));
    }

    console.log(chalk.cyan("  Fixed UI Sizes (font.size.basic.*):"));
    console.log(chalk.gray(`    xs:   ${typography.font.size.basic.xs.value.padEnd(6)} → UI labels, captions`));
    console.log(chalk.gray(`    sm:   ${typography.font.size.basic.sm.value.padEnd(6)} → Buttons, inputs`));
    console.log(chalk.gray(`    base: ${typography.font.size.basic.base.value.padEnd(6)} → Body text`));
    console.log(chalk.gray(`    lg:   ${typography.font.size.basic.lg.value.padEnd(6)} → Emphasized labels`));
    console.log("");

    console.log(chalk.cyan("  Modular Scale (font.size.scale.*):"));
    for (const [step, size] of Object.entries(calculatedSizes)) {
      console.log(chalk.gray(`    ${step}:    ${size}px`.padEnd(20) + ` → ${baseSize} × ${ratio}^${step}`));
    }

    console.log("\n" + chalk.green("✓ Typography separation complete!\n"));
  } catch (error) {
    console.error(chalk.red("✗ Type scale generation failed:"), error.message);
    process.exit(1);
  }
}

/**
 * Get ratio name from scale data
 */
function getRatioName(targetRatio, scaleData) {
  for (const [name, data] of Object.entries(scaleData.scale)) {
    if (Math.abs(parseFloat(data.value) - targetRatio) < 0.01) {
      return name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }
  return "Custom";
}

// Run if called directly
generateTypeScale();

export default generateTypeScale;
