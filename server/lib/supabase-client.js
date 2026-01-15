/**
 * Supabase Client for Backend API
 * PRD 0051: Multi-tenant database integration
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabaseClient = null;
let supabaseAdminClient = null;

/**
 * Check if Supabase is configured
 */
export function isSupabaseEnabled() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Get Supabase client instance
 */
export function getSupabaseClient() {
  if (!isSupabaseEnabled()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabaseClient;
}

/**
 * Get admin Supabase client with service role key
 * PRD 0072: Bypasses RLS for dev mode operations
 * SECURITY: Only available in development mode
 */
export function getAdminClient() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Admin client is not available in production");
  }

  if (!isSupabaseEnabled()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Service role key not configured. Set SUPABASE_SERVICE_KEY"
    );
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    console.log(
      "🔑 [PRD 0072] Admin Supabase client initialized (RLS bypass enabled)"
    );
  }

  return supabaseAdminClient;
}

/**
 * Get the appropriate Supabase client based on user context
 * PRD 0072: Returns admin client for mock users in dev mode, standard client otherwise
 * @param {Object} req - Express request object with user information
 * @returns {Object} Supabase client instance
 */
export function getDbClient(req) {
  // Check if this is a mock user in dev mode
  const isMockUser = req?.user?.is_mock === true;
  const isDevMode =
    process.env.VITE_DEV_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production";

  if (isMockUser && isDevMode) {
    console.log("🚨 [PRD 0072] Using Admin Client for Mock User (RLS bypass)");
    return getAdminClient();
  }

  return getSupabaseClient();
}

/**
 * Create authenticated Supabase client from access token
 */
export function getAuthenticatedClient(accessToken) {
  if (!isSupabaseEnabled()) {
    throw new Error("Supabase is not configured");
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Verify user authentication and extract user ID
 */
export async function verifyAuth(accessToken) {
  const client = getAuthenticatedClient(accessToken);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error("Invalid authentication token");
  }

  return user;
}

/**
 * Check if user has required role for a project
 */
export async function checkProjectRole(
  userId,
  projectId,
  requiredRoles = ["editor", "admin"]
) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .single();

  if (error || !data) {
    return false;
  }

  return requiredRoles.includes(data.role);
}

export default {
  isSupabaseEnabled,
  getSupabaseClient,
  getAdminClient,
  getDbClient,
  getAuthenticatedClient,
  verifyAuth,
  checkProjectRole,
};
