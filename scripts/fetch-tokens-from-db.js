#!/usr/bin/env node

/**
 * Fetch Resolved Tokens from Database
 * PRD 0051: Fetches tokens with inheritance resolved for a specific brand
 * 
 * Usage: node scripts/fetch-tokens-from-db.js --brand=<brand-id> --output=tokens.json
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Supabase credentials not found");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Convert flat token list to nested structure
 */
function buildTokenTree(tokens) {
  const tree = {};
  
  for (const token of tokens) {
    const parts = token.token_path.split(".");
    let current = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      
      if (isLast) {
        // Leaf node - actual token
        current[part] = {
          value: JSON.parse(token.value),
          $type: token.token_type,
        };
        if (token.description) {
          current[part].$description = token.description;
        }
      } else {
        // Branch node - group
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  
  return tree;
}

async function main() {
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split("=");
    acc[key.replace("--", "")] = value;
    return acc;
  }, {});
  
  const brandId = args.brand || process.env.BRAND_ID;
  const outputFile = args.output || "tokens-resolved.json";
  
  if (!brandId) {
    console.error("❌ Brand ID required: --brand=<uuid>");
    process.exit(1);
  }
  
  console.log(`\n🔍 Fetching tokens for brand: ${brandId}\n`);
  
  try {
    // Fetch resolved tokens using the inheritance function
    const { data, error } = await supabase
      .rpc("resolve_brand_tokens", { target_brand_id: brandId });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.warn("⚠️  No tokens found for this brand");
      await fs.writeJSON(outputFile, {}, { spaces: 2 });
      return;
    }
    
    console.log(`✓ Fetched ${data.length} tokens (with inheritance resolved)`);
    
    // Convert to nested structure
    const tokenTree = buildTokenTree(data);
    
    // Write to output file
    await fs.writeJSON(outputFile, tokenTree, { spaces: 2 });
    
    console.log(`✓ Tokens written to: ${outputFile}\n`);
    
    // Print summary
    const bySource = data.reduce((acc, t) => {
      acc[t.source_level] = (acc[t.source_level] || 0) + 1;
      return acc;
    }, {});
    
    console.log("📊 Token source breakdown:");
    Object.entries(bySource).forEach(([source, count]) => {
      console.log(`   ${source}: ${count}`);
    });
    console.log("");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
