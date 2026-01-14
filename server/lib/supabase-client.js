/**
 * Supabase Client for Backend API
 * PRD 0051: Multi-tenant database integration
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;

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
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  
  return supabaseClient;
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
  const { data: { user }, error } = await client.auth.getUser();
  
  if (error || !user) {
    throw new Error("Invalid authentication token");
  }
  
  return user;
}

/**
 * Check if user has required role for a project
 */
export async function checkProjectRole(userId, projectId, requiredRoles = ['editor', 'admin']) {
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
  getAuthenticatedClient,
  verifyAuth,
  checkProjectRole,
};
