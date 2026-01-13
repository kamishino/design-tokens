#!/usr/bin/env node

/**
 * Project Scaffolding CLI Tool
 * 
 * Creates a new design token project by copying the core engine
 * and resetting the token files to a starter set.
 * 
 * Usage: npm run project:clone
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`),
};

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log("\n");
  log.step("🚀 Design Token Project Scaffolding");
  console.log("─".repeat(50));
  console.log("\n");

  // Get project name
  const projectName = await question(
    "Enter new project name (e.g., acme-design-tokens): "
  );

  if (!projectName || !/^[a-z0-9-]+$/.test(projectName)) {
    log.error(
      "Invalid project name. Use lowercase alphanumeric with hyphens only."
    );
    rl.close();
    process.exit(1);
  }

  // Get target directory
  const defaultTarget = path.join(process.cwd(), "..", projectName);
  const targetDirInput = await question(
    `Target directory [${defaultTarget}]: `
  );
  const targetDir = targetDirInput.trim() || defaultTarget;

  // Check if directory exists
  if (fs.existsSync(targetDir)) {
    const overwrite = await question(
      `Directory ${targetDir} already exists. Overwrite? (y/N): `
    );
    if (overwrite.toLowerCase() !== "y") {
      log.info("Aborted.");
      rl.close();
      process.exit(0);
    }
    fs.removeSync(targetDir);
  }

  console.log("\n");
  log.step("📦 Cloning Project Structure");
  console.log("─".repeat(50));

  const sourceDir = path.join(__dirname, "..");

  // Directories to copy
  const dirsToCopy = [
    "scripts",
    "site",
    "server",
    ".windsurf",
    "docs",
    "database",
  ];

  // Create target directory
  fs.ensureDirSync(targetDir);

  // Copy directories
  for (const dir of dirsToCopy) {
    const src = path.join(sourceDir, dir);
    const dest = path.join(targetDir, dir);

    if (fs.existsSync(src)) {
      log.info(`Copying ${dir}/...`);
      fs.copySync(src, dest, {
        filter: (src) => {
          // Exclude node_modules, dist, and other build artifacts
          return !/node_modules|dist|\.cache|\.vite/.test(src);
        },
      });
      log.success(`${dir}/ copied`);
    }
  }

  // Copy essential root files
  const filesToCopy = [
    ".gitignore",
    "README.md",
    "LICENSE",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.node.json",
  ];

  for (const file of filesToCopy) {
    const src = path.join(sourceDir, file);
    const dest = path.join(targetDir, file);

    if (fs.existsSync(src)) {
      fs.copySync(src, dest);
    }
  }

  log.success("Core files copied");

  // Create starter token set
  console.log("\n");
  log.step("🎨 Creating Starter Token Set");
  console.log("─".repeat(50));

  const tokensDir = path.join(targetDir, "tokens");
  fs.ensureDirSync(tokensDir);

  // Create primitives
  const primitivesDir = path.join(tokensDir, "primitives");
  fs.ensureDirSync(primitivesDir);

  // Starter colors
  const colorsJson = {
    color: {
      gray: {
        50: { $value: "#f9fafb", $type: "color" },
        100: { $value: "#f3f4f6", $type: "color" },
        200: { $value: "#e5e7eb", $type: "color" },
        500: { $value: "#6b7280", $type: "color" },
        900: { $value: "#111827", $type: "color" },
      },
      primary: {
        500: { $value: "#3b82f6", $type: "color" },
        600: { $value: "#2563eb", $type: "color" },
      },
    },
  };

  fs.writeJsonSync(
    path.join(primitivesDir, "colors.json"),
    colorsJson,
    { spaces: 2 }
  );

  // Starter spacing
  const spacingJson = {
    spacing: {
      xs: { $value: "0.25rem", $type: "dimension" },
      sm: { $value: "0.5rem", $type: "dimension" },
      md: { $value: "1rem", $type: "dimension" },
      lg: { $value: "1.5rem", $type: "dimension" },
      xl: { $value: "2rem", $type: "dimension" },
    },
  };

  fs.writeJsonSync(
    path.join(primitivesDir, "spacing.json"),
    spacingJson,
    { spaces: 2 }
  );

  log.success("Starter tokens created");

  // Update package.json
  console.log("\n");
  log.step("📝 Updating package.json");
  console.log("─".repeat(50));

  const packageJsonPath = path.join(targetDir, "package.json");
  const sourcePackageJson = fs.readJsonSync(
    path.join(sourceDir, "package.json")
  );

  const newPackageJson = {
    ...sourcePackageJson,
    name: `@your-org/${projectName}`,
    description: `Design tokens for ${projectName}`,
    version: "0.1.0",
  };

  fs.writeJsonSync(packageJsonPath, newPackageJson, { spaces: 2 });
  log.success("package.json updated");

  // Initialize Git
  console.log("\n");
  log.step("🔧 Initializing Git Repository");
  console.log("─".repeat(50));

  try {
    execSync("git init", { cwd: targetDir, stdio: "ignore" });
    execSync("git add .", { cwd: targetDir, stdio: "ignore" });
    execSync('git commit -m "Initial commit: Project scaffolded"', {
      cwd: targetDir,
      stdio: "ignore",
    });
    log.success("Git repository initialized");
  } catch (err) {
    log.warning("Git initialization failed (may not have git installed)");
  }

  // Final instructions
  console.log("\n");
  log.step("✨ Project Created Successfully!");
  console.log("─".repeat(50));
  console.log("\n");
  console.log(`${colors.bright}Next steps:${colors.reset}`);
  console.log(`  1. cd ${targetDir}`);
  console.log(`  2. npm install`);
  console.log(`  3. npm run dev`);
  console.log("\n");
  log.info(`Project: ${colors.bright}${projectName}${colors.reset}`);
  log.info(`Location: ${colors.bright}${targetDir}${colors.reset}`);
  console.log("\n");

  rl.close();
}

main().catch((err) => {
  log.error(`Error: ${err.message}`);
  rl.close();
  process.exit(1);
});
