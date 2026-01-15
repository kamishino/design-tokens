/**
 * Authentication Middleware for Express
 * PRD 0051: Supabase Auth integration
 * PRD 0058: Dev Auth Bypass support
 */

import { verifyAuth, isSupabaseEnabled } from "../lib/supabase-client.js";

// Dev Auth Bypass Configuration (PRD 0058, PRD 0061)
const DEV_AUTH_BYPASS = process.env.VITE_DEV_AUTH_BYPASS === 'true';
const DEV_MOCK_TOKEN = 'DEV_MOCK_TOKEN';
const DEV_MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'; // Valid UUID for dev mode (PRD 0061)
const DEV_AUTH_USER_EMAIL = process.env.DEV_AUTH_USER_EMAIL || 'dev@example.com';
const DEV_AUTH_USER_NAME = process.env.DEV_AUTH_USER_NAME || 'Dev Admin';

/**
 * Create mock user for dev bypass mode
 * PRD 0061: Uses valid UUID format to prevent database errors
 */
function createMockDevUser() {
  return {
    id: DEV_MOCK_USER_ID,
    email: DEV_AUTH_USER_EMAIL,
    role: 'authenticated',
    user_metadata: {
      name: DEV_AUTH_USER_NAME,
      full_name: DEV_AUTH_USER_NAME,
      role: 'admin'
    }
  };
}

/**
 * Middleware to verify Supabase authentication
 * Extracts user from Bearer token and attaches to req.user
 * 
 * PRD 0058: Supports dev auth bypass mode for faster local development
 */
export async function authenticateUser(req, res, next) {
  // DEV AUTH BYPASS (PRD 0058): Security check - only in development
  if (DEV_AUTH_BYPASS && process.env.NODE_ENV !== 'production') {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);
    
    if (token === DEV_MOCK_TOKEN) {
      console.warn('🚨 DEV AUTH BYPASS: Using mock user for request');
      req.user = createMockDevUser();
      return next();
    }
  }

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
 * PRD 0061: Bypasses checks for mock user in dev mode
 */
export function requireProjectRole(requiredRoles = ['editor', 'admin']) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // DEV AUTH BYPASS (PRD 0061): Grant mock user super admin access
    if (DEV_AUTH_BYPASS && process.env.NODE_ENV !== 'production' && req.user.id === DEV_MOCK_USER_ID) {
      console.warn('🚨 DEV AUTH BYPASS: Granting super admin access to mock user');
      return next();
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
