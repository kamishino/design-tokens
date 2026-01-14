/**
 * Multi-Project API Routes
 * PRD 0051: REST API for multi-tenant token management
 */

import express from "express";
import { getSupabaseClient, isSupabaseEnabled } from "../lib/supabase-client.js";
import { authenticateUser, requireAuth, requireProjectRole } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// ============================================================================
// ORGANIZATIONS
// ============================================================================

/**
 * GET /api/mp/organizations
 * List all organizations
 */
router.get("/organizations", async (req, res) => {
  if (!isSupabaseEnabled()) {
    return res.status(503).json({ error: "Multi-project mode not available" });
  }
  
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .order("name");
    
    if (error) throw error;
    
    res.json({ organizations: data });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({ error: "Failed to fetch organizations" });
  }
});

/**
 * POST /api/mp/organizations
 * Create a new organization
 */
router.post("/organizations", requireAuth, async (req, res) => {
  try {
    const { name, slug } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name, slug })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ organization: data });
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ error: "Failed to create organization" });
  }
});

// ============================================================================
// PROJECTS
// ============================================================================

/**
 * GET /api/mp/organizations/:orgId/projects
 * List projects for an organization
 */
router.get("/organizations/:orgId/projects", async (req, res) => {
  try {
    const { orgId } = req.params;
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, slug, description, git_url, created_at")
      .eq("organization_id", orgId)
      .order("name");
    
    if (error) throw error;
    
    res.json({ projects: data });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

/**
 * POST /api/mp/organizations/:orgId/projects
 * Create a new project
 */
router.post("/organizations/:orgId/projects", requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    const { name, slug, description, git_url } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        organization_id: orgId,
        name,
        slug,
        description,
        git_url,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ project: data });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// ============================================================================
// BRANDS
// ============================================================================

/**
 * GET /api/mp/projects/:projectId/brands
 * List brands for a project
 */
router.get("/projects/:projectId/brands", async (req, res) => {
  try {
    const { projectId } = req.params;
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, description, is_default, created_at")
      .eq("project_id", projectId)
      .order("name");
    
    if (error) throw error;
    
    res.json({ brands: data });
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

/**
 * POST /api/mp/projects/:projectId/brands
 * Create a new brand
 */
router.post("/projects/:projectId/brands", requireAuth, requireProjectRole(['editor', 'admin']), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, slug, description, is_default } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("brands")
      .insert({
        project_id: projectId,
        name,
        slug,
        description,
        is_default: is_default || false,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ brand: data });
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({ error: "Failed to create brand" });
  }
});

// ============================================================================
// TOKENS
// ============================================================================

/**
 * GET /api/mp/brands/:brandId/tokens
 * Get resolved tokens for a brand (with inheritance)
 */
router.get("/brands/:brandId/tokens", async (req, res) => {
  try {
    const { brandId } = req.params;
    const supabase = getSupabaseClient();
    
    // Use the resolve_brand_tokens function for inheritance
    const { data, error } = await supabase
      .rpc("resolve_brand_tokens", { target_brand_id: brandId });
    
    if (error) throw error;
    
    res.json({ tokens: data });
  } catch (error) {
    console.error("Error fetching brand tokens:", error);
    res.status(500).json({ error: "Failed to fetch tokens" });
  }
});

/**
 * POST /api/mp/brands/:brandId/tokens
 * Create or update a token
 */
router.post("/brands/:brandId/tokens", requireAuth, async (req, res) => {
  try {
    const { brandId } = req.params;
    const { token_path, token_type, value, description } = req.body;
    
    if (!token_path || !token_type || value === undefined) {
      return res.status(400).json({ error: "token_path, token_type, and value are required" });
    }
    
    const supabase = getSupabaseClient();
    
    // Get brand's project_id for permission check
    const { data: brand } = await supabase
      .from("brands")
      .select("project_id")
      .eq("id", brandId)
      .single();
    
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }
    
    // Check permissions
    const { checkProjectRole } = await import("../lib/supabase-client.js");
    const hasPermission = await checkProjectRole(req.user.id, brand.project_id, ['editor', 'admin']);
    
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    // Insert or update token
    const { data, error } = await supabase
      .from("tokens")
      .upsert({
        brand_id: brandId,
        token_path,
        token_type,
        value: JSON.stringify(value),
        description,
        updated_by: req.user.id,
      }, {
        onConflict: "brand_id,token_path",
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ token: data });
  } catch (error) {
    console.error("Error saving token:", error);
    res.status(500).json({ error: "Failed to save token" });
  }
});

/**
 * DELETE /api/mp/brands/:brandId/tokens/:tokenPath
 * Delete a token
 */
router.delete("/brands/:brandId/tokens/:tokenPath", requireAuth, async (req, res) => {
  try {
    const { brandId, tokenPath } = req.params;
    const supabase = getSupabaseClient();
    
    // Get brand's project_id for permission check
    const { data: brand } = await supabase
      .from("brands")
      .select("project_id")
      .eq("id", brandId)
      .single();
    
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }
    
    // Check permissions
    const { checkProjectRole } = await import("../lib/supabase-client.js");
    const hasPermission = await checkProjectRole(req.user.id, brand.project_id, ['editor', 'admin']);
    
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    const { error } = await supabase
      .from("tokens")
      .delete()
      .eq("brand_id", brandId)
      .eq("token_path", decodeURIComponent(tokenPath));
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting token:", error);
    res.status(500).json({ error: "Failed to delete token" });
  }
});

// ============================================================================
// GLOBAL TOKENS
// ============================================================================

/**
 * GET /api/mp/tokens/global
 * Get all global tokens
 */
router.get("/tokens/global", async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tokens")
      .select("id, token_path, token_type, value, description, created_at")
      .eq("is_global", true)
      .order("token_path");
    
    if (error) throw error;
    
    res.json({ tokens: data });
  } catch (error) {
    console.error("Error fetching global tokens:", error);
    res.status(500).json({ error: "Failed to fetch global tokens" });
  }
});

/**
 * POST /api/mp/tokens/global
 * Create or update a global token (admin only)
 */
router.post("/tokens/global", requireAuth, async (req, res) => {
  try {
    const { token_path, token_type, value, description } = req.body;
    
    if (!token_path || !token_type || value === undefined) {
      return res.status(400).json({ error: "token_path, token_type, and value are required" });
    }
    
    // Check if user is admin (has admin role in any project)
    const supabase = getSupabaseClient();
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", req.user.id)
      .eq("role", "admin")
      .limit(1);
    
    if (!roles || roles.length === 0) {
      return res.status(403).json({ error: "Only admins can manage global tokens" });
    }
    
    const { data, error } = await supabase
      .from("tokens")
      .upsert({
        token_path,
        token_type,
        value: JSON.stringify(value),
        description,
        is_global: true,
        updated_by: req.user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ token: data });
  } catch (error) {
    console.error("Error saving global token:", error);
    res.status(500).json({ error: "Failed to save global token" });
  }
});

export default router;
