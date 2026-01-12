/**
 * Test Design Token Build Process
 * Verifies that all build outputs are generated correctly
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = path.join(__dirname, "../dist");

async function runTests() {
  console.log(chalk.blue("🧪 Running token tests...\n"));

  let passed = 0;
  let failed = 0;

  // Test 1: Check CSS file exists
  await test(
    "CSS variables file exists",
    async () => {
      const cssFile = path.join(DIST_DIR, "css/variables.css");
      return await fs.pathExists(cssFile);
    },
    passed,
    failed
  );

  // Test 2: Check SCSS file exists
  await test(
    "SCSS variables file exists",
    async () => {
      const scssFile = path.join(DIST_DIR, "scss/_variables.scss");
      return await fs.pathExists(scssFile);
    },
    passed,
    failed
  );

  // Test 3: Check JS files exist
  await test(
    "JavaScript files exist",
    async () => {
      const jsFile = path.join(DIST_DIR, "js/tokens.js");
      const mjsFile = path.join(DIST_DIR, "js/tokens.mjs");
      const dtsFile = path.join(DIST_DIR, "js/tokens.d.ts");

      return (
        (await fs.pathExists(jsFile)) &&
        (await fs.pathExists(mjsFile)) &&
        (await fs.pathExists(dtsFile))
      );
    },
    passed,
    failed
  );

  // Test 4: Check JSON file exists
  await test(
    "JSON tokens file exists",
    async () => {
      const jsonFile = path.join(DIST_DIR, "json/tokens.json");
      return await fs.pathExists(jsonFile);
    },
    passed,
    failed
  );

  // Test 5: Validate CSS content
  await test(
    "CSS contains :root declaration",
    async () => {
      const cssFile = path.join(DIST_DIR, "css/variables.css");
      if (!(await fs.pathExists(cssFile))) return false;

      const content = await fs.readFile(cssFile, "utf-8");
      return content.includes(":root");
    },
    passed,
    failed
  );

  // Test 6: Validate SCSS content
  await test(
    "SCSS contains variable definitions",
    async () => {
      const scssFile = path.join(DIST_DIR, "scss/_variables.scss");
      if (!(await fs.pathExists(scssFile))) return false;

      const content = await fs.readFile(scssFile, "utf-8");
      return content.includes("$");
    },
    passed,
    failed
  );

  // Test 7: Validate JS is valid JSON structure
  await test(
    "JavaScript module exports valid structure",
    async () => {
      const jsFile = path.join(DIST_DIR, "js/tokens.js");
      if (!(await fs.pathExists(jsFile))) return false;

      try {
        const tokens = require(jsFile);
        return typeof tokens === "object" && tokens !== null;
      } catch {
        return false;
      }
    },
    passed,
    failed
  );

  // Test 8: Validate JSON structure
  await test(
    "JSON has correct structure",
    async () => {
      const jsonFile = path.join(DIST_DIR, "json/tokens.json");
      if (!(await fs.pathExists(jsonFile))) return false;

      const content = await fs.readJSON(jsonFile);
      return typeof content === "object" && content !== null;
    },
    passed,
    failed
  );

  // Summary
  console.log("\n" + chalk.blue("─".repeat(50)));
  console.log(chalk.green(`✓ Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`✗ Failed: ${failed}`));
  }
  console.log(chalk.blue("─".repeat(50)));

  if (failed > 0) {
    console.log(chalk.red("\n✗ Some tests failed"));
    process.exit(1);
  } else {
    console.log(chalk.green("\n✓ All tests passed!"));
    process.exit(0);
  }
}

async function test(description, testFn, passed, failed) {
  try {
    const result = await testFn();
    if (result) {
      console.log(chalk.green("✓"), description);
      return passed + 1;
    } else {
      console.log(chalk.red("✗"), description);
      return failed + 1;
    }
  } catch (error) {
    console.log(chalk.red("✗"), description, chalk.gray(`(${error.message})`));
    return failed + 1;
  }
}

runTests();
