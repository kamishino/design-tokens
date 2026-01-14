/**
 * Token Validation API Routes
 * PRD 0052: REST API for token validation and health reports
 */

import express from "express";
import { getSupabaseClient, isSupabaseEnabled } from "../lib/supabase-client.js";
import { authenticateUser } from "../middleware/auth.js";
import {
  validateToken,
  validateContrast,
  validateTokenPath,
  validateTypeAndValue,
  checkAliasIntegrity,
} from "../../lib/utils/validation.js";

const router = express.Router();

// Apply authentication middleware
router.use(authenticateUser);

// ============================================================================
// VALIDATION ENDPOINTS
// ============================================================================

/**
 * POST /api/validation/token
 * Validate a single token
 */
router.post("/token", async (req, res) => {
  try {
    const { token, tokenSet } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "Token object is required" });
    }
    
    const result = validateToken(token, tokenSet || []);
    
    res.json({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ error: "Validation failed", message: error.message });
  }
});

/**
 * POST /api/validation/contrast
 * Check color contrast for accessibility
 */
router.post("/contrast", async (req, res) => {
  try {
    const { textColor, backgroundColor, textSize, requirements } = req.body;
    
    if (!textColor || !backgroundColor) {
      return res.status(400).json({ 
        error: "Both textColor and backgroundColor are required" 
      });
    }
    
    const options = {
      textSize: textSize || "normal",
      requireWCAG21: requirements?.wcag21 !== false,
      requireAPCA: requirements?.apca === true,
      wcag21Level: requirements?.wcag21Level || "AA",
      apcaMinimum: requirements?.apcaMinimum || 60,
    };
    
    const result = validateContrast(textColor, backgroundColor, options);
    
    res.json(result);
  } catch (error) {
    console.error("Contrast validation error:", error);
    res.status(500).json({ error: "Contrast validation failed", message: error.message });
  }
});

/**
 * POST /api/validation/batch
 * Validate multiple tokens at once
 */
router.post("/batch", async (req, res) => {
  try {
    const { tokens } = req.body;
    
    if (!Array.isArray(tokens)) {
      return res.status(400).json({ error: "Tokens must be an array" });
    }
    
    const results = tokens.map(token => ({
      path: token.token_path || token.path,
      validation: validateToken(token, tokens),
    }));
    
    const summary = {
      total: results.length,
      valid: results.filter(r => r.validation.valid).length,
      invalid: results.filter(r => !r.validation.valid).length,
      withWarnings: results.filter(r => r.validation.warnings).length,
    };
    
    res.json({
      summary,
      results: results.filter(r => !r.validation.valid || r.validation.warnings),
    });
  } catch (error) {
    console.error("Batch validation error:", error);
    res.status(500).json({ error: "Batch validation failed", message: error.message });
  }
});

// ============================================================================
// VALIDATION RULES MANAGEMENT
// ============================================================================

/**
 * GET /api/validation/rules/:projectId?/:brandId?
 * Get validation rules for a project or brand
 */
router.get("/rules/:projectId?/:brandId?", async (req, res) => {
  if (!isSupabaseEnabled()) {
    return res.status(503).json({ error: "Database not available" });
  }
  
  try {
    const { projectId, brandId } = req.params;
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .rpc("get_validation_rules", {
        target_project_id: projectId || null,
        target_brand_id: brandId || null,
      });
    
    if (error) throw error;
    
    res.json({ rules: data });
  } catch (error) {
    console.error("Error fetching validation rules:", error);
    res.status(500).json({ error: "Failed to fetch validation rules" });
  }
});

/**
 * PUT /api/validation/rules/:projectId?/:brandId?
 * Update validation rules for a project or brand (admin only)
 */
router.put("/rules/:projectId?/:brandId?", async (req, res) => {
  if (!isSupabaseEnabled()) {
    return res.status(503).json({ error: "Database not available" });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const { projectId, brandId } = req.params;
    const { rules } = req.body;
    
    if (!rules) {
      return res.status(400).json({ error: "Rules object is required" });
    }
    
    const supabase = getSupabaseClient();
    
    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", req.user.id)
      .eq("role", "admin");
    
    if (!roles || roles.length === 0) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    // Upsert validation rules
    const { data, error } = await supabase
      .from("validation_rules")
      .upsert({
        project_id: projectId || null,
        brand_id: brandId || null,
        rules,
        created_by: req.user.id,
      }, {
        onConflict: "project_id,brand_id",
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, rules: data });
  } catch (error) {
    console.error("Error updating validation rules:", error);
    res.status(500).json({ error: "Failed to update validation rules" });
  }
});

// ============================================================================
// HEALTH REPORT
// ============================================================================

/**
 * GET /api/validation/health/:projectId?/:brandId?
 * Get validation health report for tokens
 */
router.get("/health/:projectId?/:brandId?", async (req, res) => {
  if (!isSupabaseEnabled()) {
    return res.status(503).json({ error: "Database not available" });
  }
  
  try {
    const { projectId, brandId } = req.params;
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .rpc("get_validation_health_report", {
        target_project_id: projectId || null,
        target_brand_id: brandId || null,
      });
    
    if (error) throw error;
    
    res.json({ health: data });
  } catch (error) {
    console.error("Error fetching health report:", error);
    res.status(500).json({ error: "Failed to fetch health report" });
  }
});

export default router;
