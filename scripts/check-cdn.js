/**
 * CDN Health Check Script
 *
 * Verifies connectivity and availability of Tabler UI CDN resources.
 * Run this script to ensure external dependencies are accessible.
 *
 * Usage: node scripts/check-cdn.js
 */

import https from "https";
import chalk from "chalk";

const CDN_RESOURCES = [
  {
    name: "Tabler Core CSS",
    url: "https://cdn.jsdelivr.net/npm/@tabler/core@latest/dist/css/tabler.min.css",
  },
  {
    name: "Tabler Core JS",
    url: "https://cdn.jsdelivr.net/npm/@tabler/core@latest/dist/js/tabler.min.js",
  },
  {
    name: "Tabler Icons CSS",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css",
  },
];

/**
 * Check if a CDN resource is accessible
 */
function checkResource(resource) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    https
      .get(resource.url, { method: "HEAD" }, (res) => {
        const loadTime = Date.now() - startTime;

        if (res.statusCode === 200) {
          resolve({
            name: resource.name,
            status: "success",
            statusCode: res.statusCode,
            loadTime,
          });
        } else {
          resolve({
            name: resource.name,
            status: "error",
            statusCode: res.statusCode,
            loadTime,
            error: `HTTP ${res.statusCode}`,
          });
        }
      })
      .on("error", (err) => {
        const loadTime = Date.now() - startTime;
        resolve({
          name: resource.name,
          status: "error",
          loadTime,
          error: err.message,
        });
      });
  });
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  console.log(chalk.blue("\n🔍 Checking CDN Health...\n"));

  const results = await Promise.all(CDN_RESOURCES.map((resource) => checkResource(resource)));

  let allPassed = true;

  results.forEach((result) => {
    if (result.status === "success") {
      console.log(chalk.green("✓"), result.name, chalk.gray(`(${result.loadTime}ms)`));
    } else {
      console.log(chalk.red("✗"), result.name, chalk.red(`- ${result.error}`));
      allPassed = false;
    }
  });

  console.log("");

  if (allPassed) {
    console.log(chalk.green.bold("✓ All CDN resources are accessible\n"));
    process.exit(0);
  } else {
    console.log(chalk.red.bold("✗ Some CDN resources failed to load\n"));
    console.log(chalk.yellow("Consider implementing a local fallback or checking your network connection.\n"));
    process.exit(1);
  }
}

// Run the health check
runHealthCheck().catch((err) => {
  console.error(chalk.red("Error running CDN health check:"), err);
  process.exit(1);
});
