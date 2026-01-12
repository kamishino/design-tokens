/**
 * Token Management API Server
 * Provides CRUD operations for design tokens
 */

import express from "express";
import cors from "cors";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const TOKENS_DIR = path.join(__dirname, "../tokens");

// Middleware
app.use(cors());
app.use(express.json());

/**
 * GET /api/files
 * List all editable token files
 */
app.get("/api/files", async (req, res) => {
  try {
    const files = await getTokenFiles(TOKENS_DIR);
    res.json({ files });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: "Failed to list token files" });
  }
});

/**
 * GET /api/tokens?file=<path>
 * Read contents of a specific token file
 */
app.get("/api/tokens", async (req, res) => {
  try {
    const { file } = req.query;

    if (!file) {
      return res.status(400).json({ error: "File parameter is required" });
    }

    const filePath = path.join(TOKENS_DIR, file);

    // Security check: ensure path is within tokens directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(TOKENS_DIR)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: "File not found" });
    }

    const content = await fs.readJSON(filePath);
    res.json({ file, content });
  } catch (error) {
    console.error("Error reading token file:", error);
    res.status(500).json({ error: "Failed to read token file" });
  }
});

/**
 * POST /api/tokens
 * Write contents to a token file
 */
app.post("/api/tokens", async (req, res) => {
  try {
    const { file, content } = req.body;

    if (!file || !content) {
      return res.status(400).json({ error: "File and content are required" });
    }

    const filePath = path.join(TOKENS_DIR, file);

    // Security check
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(TOKENS_DIR)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath));

    // Write file with pretty formatting
    await fs.writeJSON(filePath, content, { spaces: 2 });

    res.json({ success: true, message: "Token file updated successfully" });
  } catch (error) {
    console.error("Error writing token file:", error);
    res.status(500).json({ error: "Failed to write token file" });
  }
});

/**
 * POST /api/build
 * Trigger token build process
 */
app.post("/api/build", async (req, res) => {
  try {
    console.log("Starting token build process...");

    const { stdout, stderr } = await execAsync("npm run build:core && npm run build:exports", {
      cwd: path.join(__dirname, ".."),
    });

    console.log("Build completed successfully");

    res.json({
      success: true,
      message: "Build completed successfully",
      output: stdout,
      warnings: stderr,
    });
  } catch (error) {
    console.error("Build failed:", error);
    res.status(500).json({
      success: false,
      error: "Build failed",
      output: error.stdout,
      stderr: error.stderr,
    });
  }
});

/**
 * Recursively get all token files
 */
async function getTokenFiles(dir, baseDir = dir, files = []) {
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (item.isDirectory()) {
      // Skip generated and node_modules directories
      if (item.name !== "generated" && item.name !== "node_modules") {
        await getTokenFiles(fullPath, baseDir, files);
      }
    } else if (item.isFile() && item.name.endsWith(".json") && item.name !== "schema.json") {
      files.push({
        path: relativePath.replace(/\\/g, "/"),
        name: item.name,
        category: path.dirname(relativePath).replace(/\\/g, "/"),
        size: (await fs.stat(fullPath)).size,
      });
    }
  }

  return files;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Token Management API running on http://localhost:${PORT}`);
  console.log(`📁 Managing tokens in: ${TOKENS_DIR}`);
});
