/**
 * Authentication Middleware for Express
 * PRD 0051: Supabase Auth integration
 */

import { verifyAuth, isSupabaseEnabled } from "../lib/supabase-client.js";

/**
 * Middleware to verify Supabase authentication
 * Extracts user from Bearer token and attaches to req.user
 */
export async function authenticateUser(req, res, next) {
  // Skip auth if Supabase is not enabled (fallback mode)
  if (!isSupabaseEnabled()) {
    req.user = null;
    return next();
  }
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    const user = await verifyAuth(token);
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    req.user = null;
    next();
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please provide a valid access token",
    });
  }
  next();
}

/**
 * Middleware to check if user has required role for a project
 */
export function requireProjectRole(requiredRoles = ['editor', 'admin']) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const projectId = req.params.projectId || req.body.project_id;
    
    if (!projectId) {
      return res.status(400).json({ error: "Project ID required" });
    }
    
    const { checkProjectRole } = await import("../lib/supabase-client.js");
    const hasRole = await checkProjectRole(req.user.id, projectId, requiredRoles);
    
    if (!hasRole) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `Required role: ${requiredRoles.join(" or ")}`,
      });
    }
    
    next();
  };
}

export default {
  authenticateUser,
  requireAuth,
  requireProjectRole,
};
