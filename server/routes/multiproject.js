/**
 * Multi-Project API Routes
 * PRD 0051: REST API for multi-tenant token management
 * PRD 0062: Entity Management & Governance (CRUD, Validation, RBAC)
 */

import express from "express";
import { getSupabaseClient, isSupabaseEnabled } from "../lib/supabase-client.js";
import { authenticateUser, requireAuth, requireProjectRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validation.js";
import {
  organizationCreateSchema,
  organizationUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  brandCreateSchema,
  brandUpdateSchema,
} from "../lib/schemas.js";
import { validateSlug } from "../../lib/utils/validation.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// ============================================================================
// SLUG VALIDATION (PRD 0059)
// ============================================================================

/**
 * GET /api/mp/check-slug?type=project|brand|organization&value=slug-name&contextId=xxx
 * Check if a slug is available and valid
 */
router.get("/check-slug", async (req, res) => {
  try {
    const { type, value, contextId } = req.query;

    if (!type || !value) {
      return res.status(400).json({
        error: "Both 'type' and 'value' query parameters are required",
      });
    }

    // Validate slug format
    const validation = validateSlug(value);
    if (!validation.valid) {
      return res.json({
        available: false,
        valid: false,
        error: validation.error,
        suggestion: validation.suggestion,
      });
    }

    const supabase = getSupabaseClient();
    let exists = false;

    // Check uniqueness based on type
    switch (type) {
      case "organization": {
        const { data } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", value)
          .limit(1);
        exists = data && data.length > 0;
        break;
      }

      case "project": {
        if (!contextId) {
          return res.status(400).json({
            error:
              "contextId (organization_id) is required for project slug check",
          });
        }
        const { data } = await supabase
          .from("projects")
          .select("id")
          .eq("slug", value)
          .eq("organization_id", contextId)
          .limit(1);
        exists = data && data.length > 0;
        break;
      }

      case "brand": {
        if (!contextId) {
          return res.status(400).json({
            error: "contextId (project_id) is required for brand slug check",
          });
        }
        const { data } = await supabase
          .from("brands")
          .select("id")
          .eq("slug", value)
          .eq("project_id", contextId)
          .limit(1);
        exists = data && data.length > 0;
        break;
      }

      default:
        return res.status(400).json({
          error: "Invalid type. Must be 'organization', 'project', or 'brand'",
        });
    }

    res.json({
      available: !exists,
      valid: true,
      slug: value,
    });
  } catch (error) {
    console.error("Error checking slug availability:", error);
    res.status(500).json({ error: "Failed to check slug availability" });
  }
});

/**
 * GET /api/mp/suggest-slug?type=project|brand|organization&base=slug-name&contextId=xxx
 * Suggest a unique slug by auto-resolving conflicts with numeric suffixes
 * PRD 0060: Smart Slug Generator & Auto-Resolution Engine
 */
router.get("/suggest-slug", async (req, res) => {
  try {
    const { type, base, contextId } = req.query;

    if (!type || !base) {
      return res.status(400).json({
        error: "Both 'type' and 'base' query parameters are required",
      });
    }

    const supabase = getSupabaseClient();
    const MAX_ATTEMPTS = 100; // Prevent infinite loops

    // Helper function to check if a slug exists
    async function checkSlugExists(slug) {
      switch (type) {
        case "organization": {
          const { data } = await supabase
            .from("organizations")
            .select("id")
            .eq("slug", slug)
            .limit(1);
          return data && data.length > 0;
        }

        case "project": {
          if (!contextId) {
            throw new Error("contextId (organization_id) is required for project slug");
          }
          const { data } = await supabase
            .from("projects")
            .select("id")
            .eq("slug", slug)
            .eq("organization_id", contextId)
            .limit(1);
          return data && data.length > 0;
        }

        case "brand": {
          if (!contextId) {
            throw new Error("contextId (project_id) is required for brand slug");
          }
          const { data } = await supabase
            .from("brands")
            .select("id")
            .eq("slug", slug)
            .eq("project_id", contextId)
            .limit(1);
          return data && data.length > 0;
        }

        default:
          throw new Error("Invalid type. Must be 'organization', 'project', or 'brand'");
      }
    }

    // Start with the base slug
    let candidateSlug = base;
    let suffix = 0;
    let wasModified = false;

    // Loop until we find a unique slug
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const exists = await checkSlugExists(candidateSlug);

      if (!exists) {
        // Found a unique slug!
        return res.json({
          slug: candidateSlug,
          available: true,
          wasModified,
          originalBase: base,
          suffix: suffix > 0 ? suffix : null,
        });
      }

      // Slug exists, try with suffix
      suffix++;
      candidateSlug = `${base}-${suffix}`;
      wasModified = true;
    }

    // If we exhausted all attempts, return error
    return res.status(409).json({
      error: `Could not find unique slug after ${MAX_ATTEMPTS} attempts`,
      lastAttempt: candidateSlug,
    });
  } catch (error) {
    console.error("Error suggesting slug:", error);
    res.status(500).json({
      error: "Failed to suggest slug",
      details: error.message,
    });
  }
});

// ============================================================================
// ORGANIZATIONS
// ============================================================================

/**
 * GET /api/mp/organizations
 * List all organizations (excludes soft-deleted)
 * PRD 0062: Soft delete support
 */
router.get("/organizations", async (req, res) => {
  if (!isSupabaseEnabled()) {
    return res.status(503).json({ error: "Multi-project mode not available" });
  }
  
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, description, created_at")
      .is("deleted_at", null)
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
 * Create a new organization with validation
 * PRD 0062: Zod validation
 */
router.post("/organizations", requireAuth, validateBody(organizationCreateSchema), async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name, slug, description })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ organization: data });
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ error: "Failed to create organization" });
  }
});

/**
 * PATCH /api/mp/organizations/:orgId
 * Update an organization
 * PRD 0062: Edit functionality
 */
router.patch("/organizations/:orgId", requireAuth, validateBody(organizationUpdateSchema), async (req, res) => {
  try {
    const { orgId } = req.params;
    const updates = req.body;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", orgId)
      .is("deleted_at", null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Organization not found" });
      }
      throw error;
    }
    
    res.json({ organization: data });
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json({ error: "Failed to update organization" });
  }
});

/**
 * DELETE /api/mp/organizations/:orgId
 * Soft delete an organization
 * PRD 0062: Soft delete to prevent data loss
 */
router.delete("/organizations/:orgId", requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("organizations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", orgId)
      .is("deleted_at", null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Organization not found" });
      }
      throw error;
    }
    
    res.json({ 
      message: "Organization soft deleted successfully",
      organization: data 
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).json({ error: "Failed to delete organization" });
  }
});

// ============================================================================
// PROJECTS
// ============================================================================

/**
 * GET /api/mp/organizations/:orgId/projects
 * List projects for an organization (excludes soft-deleted)
 * PRD 0062: Soft delete support
 */
router.get("/organizations/:orgId/projects", async (req, res) => {
  try {
    const { orgId } = req.params;
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, slug, description, git_url, created_at")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
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
 * Create a new project with validation, auto-admin role and optional default brand
 * PRD 0062: Zod validation
 */
router.post("/organizations/:orgId/projects", requireAuth, validateBody(projectCreateSchema), async (req, res) => {
  try {
    const { orgId } = req.params;
    const { name, slug, description, git_url, create_default_brand } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const supabase = getSupabaseClient();

    // Create project
    const { data: project, error: projectError } = await supabase
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

    if (projectError) throw projectError;

    // Auto-assign creator as admin
    // PRD 0061: Skip role assignment for mock user in dev mode to avoid FK constraints
    const DEV_MOCK_USER_ID = "00000000-0000-0000-0000-000000000000";
    const isDevMockUser =
      req.user.id === DEV_MOCK_USER_ID &&
      process.env.VITE_DEV_AUTH_BYPASS === "true";

    if (!isDevMockUser) {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: req.user.id,
        organization_id: orgId,
        project_id: project.id,
        role: "admin",
      });

      if (roleError) {
        console.error("Failed to assign admin role:", roleError);
        // Don't fail the request, just log the error
      }
    } else {
      console.warn(
        "🚨 DEV AUTH BYPASS: Skipping role assignment for mock user"
      );
    }

    // Create default brand if requested
    let defaultBrand = null;
    if (create_default_brand) {
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .insert({
          project_id: project.id,
          name: "Default",
          slug: "default",
          description: "Default brand for " + name,
          is_default: true,
        })
        .select()
        .single();

      if (brandError) {
        console.error("Failed to create default brand:", brandError);
      } else {
        defaultBrand = brand;
      }
    }

    res.status(201).json({
      project,
      default_brand: defaultBrand,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ 
      error: "Failed to create project",
      details: error.message 
    });
  }
});

/**
 * PATCH /api/mp/projects/:projectId
 * Update a project
 * PRD 0062: Edit functionality
 */
router.patch("/projects/:projectId", requireAuth, requireProjectRole(['admin', 'editor']), validateBody(projectUpdateSchema), async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .is("deleted_at", null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Project not found" });
      }
      throw error;
    }
    
    res.json({ project: data });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

/**
 * DELETE /api/mp/projects/:projectId
 * Soft delete a project
 * PRD 0062: Soft delete to prevent data loss
 */
router.delete("/projects/:projectId", requireAuth, requireProjectRole(['admin']), async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", projectId)
      .is("deleted_at", null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Project not found" });
      }
      throw error;
    }
    
    res.json({ 
      message: "Project soft deleted successfully",
      project: data 
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// ============================================================================
// BRANDS
// ============================================================================

/**
 * GET /api/mp/projects/:projectId/brands
 * List brands for a project (excludes soft-deleted)
 * PRD 0062: Soft delete support
 */
router.get("/projects/:projectId/brands", async (req, res) => {
  try {
    const { projectId } = req.params;
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, description, is_default, created_at")
      .eq("project_id", projectId)
      .is("deleted_at", null)
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
 * Create a new brand with validation
 * PRD 0062: Zod validation
 */
router.post("/projects/:projectId/brands", requireAuth, requireProjectRole(['editor', 'admin']), validateBody(brandCreateSchema), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, slug, description, is_default } = req.body;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("brands")
      .insert({
        project_id: projectId,
        name,
        slug,
        description,
        is_default,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ 
      brand: data,
      message: "Brand created successfully"
    });
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({ 
      error: "Failed to create brand",
      details: error.message
    });
  }
});

/**
 * PATCH /api/mp/brands/:brandId
 * Update a brand
 * PRD 0062: Edit functionality
 */
router.patch("/brands/:brandId", requireAuth, requireProjectRole(['admin', 'editor']), validateBody(brandUpdateSchema), async (req, res) => {
  try {
    const { brandId } = req.params;
    const updates = req.body;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", brandId)
      .is("deleted_at", null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Brand not found" });
      }
      throw error;
    }
    
    res.json({ brand: data });
  } catch (error) {
    console.error("Error updating brand:", error);
    res.status(500).json({ error: "Failed to update brand" });
  }
});

/**
 * DELETE /api/mp/brands/:brandId
 * Soft delete a brand
 * PRD 0062: Soft delete to prevent data loss
 */
router.delete("/brands/:brandId", requireAuth, requireProjectRole(['admin']), async (req, res) => {
  try {
    const { brandId } = req.params;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("brands")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", brandId)
      .is("deleted_at", null)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Brand not found" });
      }
      throw error;
    }
    
    res.json({ 
      message: "Brand soft deleted successfully",
      brand: data 
    });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ error: "Failed to delete brand" });
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
