#!/usr/bin/env node

/**
 * Token Migration Script: File-based to Database
 * PRD 0051: Migrates local token JSON files to Supabase multi-tenant schema
 * 
 * Usage: node scripts/migrate-tokens-to-db.js --org=acme --project=web-app --brand=default
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Supabase credentials not found in .env");
  console.error("   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY");
  console.error("   Note: Migration requires service role key to bypass RLS");
  process.exit(1);
}

// Use service key to bypass RLS policies during migration
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Recursively traverse a token object and extract individual tokens
 * @param {object} obj - Token object to traverse
 * @param {string} basePath - Current path in the token tree
 * @param {array} results - Accumulated token results
 */
function extractTokens(obj, basePath = "", results = []) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = basePath ? `${basePath}.${key}` : key;
    
    // Check if this is a token (has $value or value property)
    if (value && typeof value === "object") {
      if (value.$value !== undefined || value.value !== undefined) {
        // This is a token
        const tokenValue = value.$value ?? value.value;
        const tokenType = value.$type ?? value.type ?? inferTokenType(tokenValue);
        const description = value.$description ?? value.description;
        
        results.push({
          path: currentPath,
          type: tokenType,
          value: tokenValue,
          description: description,
        });
      } else {
        // This is a group, recurse deeper
        extractTokens(value, currentPath, results);
      }
    }
  }
  
  return results;
}

/**
 * Infer token type from value
 */
function inferTokenType(value) {
  if (typeof value === "string") {
    if (value.startsWith("#") || value.startsWith("rgb")) return "color";
    if (value.match(/^\d+(\.\d+)?(px|rem|em|%)$/)) return "dimension";
    return "string";
  }
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "array";
  return "object";
}

/**
 * Read all token files from tokens directory
 */
async function readTokenFiles(tokensDir) {
  const files = [];
  
  async function scanDir(dir, relativePath = "") {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        await scanDir(fullPath, relPath);
      } else if (entry.name.endsWith(".json") && !entry.name.startsWith("$")) {
        const content = await fs.readJSON(fullPath);
        files.push({
          path: relPath,
          content: content,
        });
      }
    }
  }
  
  await scanDir(tokensDir);
  return files;
}

/**
 * Get or create organization
 */
async function getOrCreateOrganization(slug, name) {
  // Try to find existing
  const { data: existing } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  
  if (existing) {
    console.log(`✓ Found organization: ${existing.name}`);
    return existing;
  }
  
  // Create new
  const { data: created, error } = await supabase
    .from("organizations")
    .insert({ name, slug })
    .select()
    .single();
  
  if (error) throw error;
  
  console.log(`✓ Created organization: ${created.name}`);
  return created;
}

/**
 * Get or create project
 */
async function getOrCreateProject(orgId, slug, name, gitUrl) {
  const { data: existing } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("organization_id", orgId)
    .eq("slug", slug)
    .single();
  
  if (existing) {
    console.log(`✓ Found project: ${existing.name}`);
    return existing;
  }
  
  const { data: created, error } = await supabase
    .from("projects")
    .insert({
      organization_id: orgId,
      name,
      slug,
      git_url: gitUrl,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  console.log(`✓ Created project: ${created.name}`);
  return created;
}

/**
 * Get or create brand
 */
async function getOrCreateBrand(projectId, slug, name, isDefault = false) {
  const { data: existing } = await supabase
    .from("brands")
    .select("id, name, slug")
    .eq("project_id", projectId)
    .eq("slug", slug)
    .single();
  
  if (existing) {
    console.log(`✓ Found brand: ${existing.name}`);
    return existing;
  }
  
  const { data: created, error } = await supabase
    .from("brands")
    .insert({
      project_id: projectId,
      name,
      slug,
      is_default: isDefault,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  console.log(`✓ Created brand: ${created.name}`);
  return created;
}

/**
 * Insert tokens into database
 */
async function insertTokens(brandId, tokens) {
  const tokenRecords = tokens.map(token => ({
    brand_id: brandId,
    token_path: token.path,
    token_type: token.type,
    value: JSON.stringify(token.value),
    description: token.description,
  }));
  
  // Insert in batches to avoid hitting limits
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < tokenRecords.length; i += batchSize) {
    const batch = tokenRecords.slice(i, i + batchSize);
    const { error } = await supabase
      .from("tokens")
      .upsert(batch, {
        onConflict: "brand_id,token_path",
      });
    
    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      throw error;
    }
    
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${tokenRecords.length} tokens...`);
  }
  
  return inserted;
}

// ============================================================================
// Main Migration Function
// ============================================================================

async function main() {
  console.log("\n🚀 Token Migration: Files to Database\n");
  console.log("=" .repeat(50));
  
  // Parse command line arguments
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split("=");
    acc[key.replace("--", "")] = value;
    return acc;
  }, {});
  
  const orgSlug = args.org || "default-org";
  const orgName = args.orgName || "Default Organization";
  const projectSlug = args.project || "default-project";
  const projectName = args.projectName || "Default Project";
  const brandSlug = args.brand || "default";
  const brandName = args.brandName || "Default";
  const tokensDir = args.tokensDir || path.join(__dirname, "..", "tokens");
  
  console.log("\nConfiguration:");
  console.log(`  Organization: ${orgName} (${orgSlug})`);
  console.log(`  Project: ${projectName} (${projectSlug})`);
  console.log(`  Brand: ${brandName} (${brandSlug})`);
  console.log(`  Tokens Directory: ${tokensDir}\n`);
  
  try {
    // Step 1: Create/get organization
    console.log("\n📁 Step 1: Organization Setup");
    const org = await getOrCreateOrganization(orgSlug, orgName);
    
    // Step 2: Create/get project
    console.log("\n📁 Step 2: Project Setup");
    const project = await getOrCreateProject(
      org.id,
      projectSlug,
      projectName,
      args.gitUrl
    );
    
    // Step 3: Create/get brand
    console.log("\n📁 Step 3: Brand Setup");
    const brand = await getOrCreateBrand(
      project.id,
      brandSlug,
      brandName,
      true
    );
    
    // Step 4: Read token files
    console.log("\n📖 Step 4: Reading Token Files");
    const tokenFiles = await readTokenFiles(tokensDir);
    console.log(`✓ Found ${tokenFiles.length} token files`);
    
    // Step 5: Extract and migrate tokens
    console.log("\n🔄 Step 5: Extracting and Migrating Tokens");
    let totalTokens = 0;
    
    for (const file of tokenFiles) {
      console.log(`\n  Processing: ${file.path}`);
      const tokens = extractTokens(file.content);
      console.log(`  Extracted ${tokens.length} tokens`);
      
      if (tokens.length > 0) {
        await insertTokens(brand.id, tokens);
        totalTokens += tokens.length;
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log(`\n✨ Migration Complete!`);
    console.log(`   Total tokens migrated: ${totalTokens}`);
    console.log(`   Organization: ${org.slug}`);
    console.log(`   Project: ${project.slug}`);
    console.log(`   Brand: ${brand.slug}\n`);
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
main();
