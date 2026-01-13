#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * Tests the Supabase configuration and connection status
 * 
 * Usage: node scripts/test-supabase.js
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = join(__dirname, "..", ".env");
dotenv.config({ path: envPath });

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

async function testSupabaseConnection() {
  console.log("\n");
  log.step("🔌 Supabase Connection Test");
  console.log("─".repeat(50));
  console.log("\n");

  // Check environment variables
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  log.info("Checking environment variables...");
  console.log(`  VITE_SUPABASE_URL: ${SUPABASE_URL ? "✓ Set" : "✗ Missing"}`);
  console.log(`  VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log.error("Missing Supabase credentials in .env file");
    console.log("\n");
    log.info("Expected format in .env:");
    console.log("  VITE_SUPABASE_URL=https://your-project.supabase.co");
    console.log("  VITE_SUPABASE_ANON_KEY=your-anon-key-here");
    console.log("\n");
    process.exit(1);
  }

  log.success("Environment variables found");
  console.log("\n");

  // Validate URL format
  log.info("Validating URL format...");
  try {
    new URL(SUPABASE_URL);
    log.success(`URL is valid: ${SUPABASE_URL}`);
  } catch (err) {
    log.error(`Invalid URL format: ${SUPABASE_URL}`);
    process.exit(1);
  }

  console.log("\n");

  // Create Supabase client
  log.info("Creating Supabase client...");
  let supabase;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    log.success("Supabase client created");
  } catch (err) {
    log.error(`Failed to create client: ${err.message}`);
    process.exit(1);
  }

  console.log("\n");

  // Test connection - try to query projects table
  log.info("Testing database connection...");
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .limit(1);

    if (error) {
      if (error.code === "42P01") {
        log.warning("Projects table doesn't exist yet");
        log.info(
          "Run database/supabase-schema.sql in Supabase SQL Editor to create tables"
        );
      } else {
        log.error(`Database error: ${error.message}`);
        log.info(`Error code: ${error.code}`);
      }
    } else {
      log.success("Database connection successful!");
      if (data && data.length > 0) {
        log.success(`Found ${data.length} project(s)`);
        data.forEach((p) => console.log(`  - ${p.name} (ID: ${p.id})`));
      } else {
        log.info("No projects found (table is empty)");
      }
    }
  } catch (err) {
    log.error(`Connection test failed: ${err.message}`);
    process.exit(1);
  }

  console.log("\n");
  log.step("✨ Connection Test Complete");
  console.log("\n");
}

testSupabaseConnection().catch((err) => {
  log.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
