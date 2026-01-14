import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables for Supabase connection
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Debug: Log environment variable status (remove after testing)
console.log("[Supabase Debug] URL:", SUPABASE_URL ? "✓ Loaded" : "✗ Missing");
console.log("[Supabase Debug] Key:", SUPABASE_ANON_KEY ? "✓ Loaded" : "✗ Missing");

// Import types
import type { 
  Organization, 
  Project, 
  Brand, 
  CreateProjectRequest, 
  CreateBrandRequest 
} from "../types";

export interface TokenDraft {
  id?: string;
  project_id: string;
  file_path: string;
  content_json: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Singleton Supabase client
let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize and return the Supabase client
 * Falls back to mock/local-only mode if credentials are missing
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "Supabase credentials not found. Running in local-only mode. " +
        "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables to enable collaboration features."
    );
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabaseClient;
}

/**
 * Check if Supabase is available and configured
 */
export function isSupabaseEnabled(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

/**
 * Fetch all projects from the registry
 */
export async function fetchProjects(): Promise<Project[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("projects")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching projects:", err);
    return [];
  }
}

/**
 * Fetch token drafts for a specific project
 */
export async function fetchDrafts(projectId: string): Promise<TokenDraft[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("token_drafts")
      .select("*")
      .eq("project_id", projectId);

    if (error) {
      console.error("Error fetching drafts:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching drafts:", err);
    return [];
  }
}

/**
 * Save or update a token draft
 */
export async function saveDraft(draft: TokenDraft): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from("token_drafts").upsert(
      {
        project_id: draft.project_id,
        file_path: draft.file_path,
        content_json: draft.content_json,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "project_id,file_path",
      }
    );

    if (error) {
      console.error("Error saving draft:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception saving draft:", err);
    return false;
  }
}

/**
 * Subscribe to real-time changes for a project's drafts
 */
export function subscribeToDrafts(
  projectId: string,
  callback: (payload: any) => void
) {
  const client = getSupabaseClient();
  if (!client) return null;

  const subscription = client
    .channel(`drafts:${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "token_drafts",
        filter: `project_id=eq.${projectId}`,
      },
      callback
    )
    .subscribe();

  return subscription;
}

// Legacy createProject function removed - replaced by new multi-project API version below

/**
 * Delete all drafts for a project (used when publishing to production)
 */
export async function clearDrafts(projectId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from("token_drafts")
      .delete()
      .eq("project_id", projectId);

    if (error) {
      console.error("Error clearing drafts:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception clearing drafts:", err);
    return false;
  }
}

// ============================================================================
// Multi-Project API Functions (PRD 0054)
// ============================================================================

/**
 * Fetch all organizations
 */
export async function fetchOrganizations(): Promise<Organization[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("organizations")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching organizations:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching organizations:", err);
    return [];
  }
}

/**
 * Create a new project via backend API
 */
export async function createProject(
  orgId: string,
  projectData: CreateProjectRequest
): Promise<{ success: boolean; project?: Project; error?: string }> {
  try {
    const response = await apiFetch(`/api/mp/organizations/${orgId}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to create project",
      };
    }

    return { success: true, project: result.project };
  } catch (err) {
    console.error("Exception creating project:", err);
    return { success: false, error: "Network error" };
  }
}

/**
 * Fetch brands for a project
 */
export async function fetchBrands(projectId: string): Promise<Brand[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("brands")
      .select("*")
      .eq("project_id", projectId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching brands:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching brands:", err);
    return [];
  }
}

/**
 * Create a new brand via backend API
 */
export async function createBrand(
  projectId: string,
  brandData: CreateBrandRequest
): Promise<{ success: boolean; brand?: Brand; error?: string }> {
  try {
    const response = await apiFetch(`/api/mp/projects/${projectId}/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(brandData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to create brand",
      };
    }

    return { success: true, brand: result.brand };
  } catch (err) {
    console.error("Exception creating brand:", err);
    return { success: false, error: "Network error" };
  }
}

// ============================================================================
// JWT Interceptor for Authenticated API Calls (PRD 0055)
// ============================================================================

/**
 * Fetch utility that automatically includes JWT token in Authorization header
 * Use this for all backend API calls that require authentication
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = getSupabaseClient();

  // Get current session and token
  const session = supabase ? await supabase.auth.getSession() : null;
  const token = session?.data?.session?.access_token;

  // Add Authorization header if token exists
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Make the request with auth header
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401 && supabase) {
    console.warn("Session expired, signing out...");
    await supabase.auth.signOut();
    // Optionally redirect to login or refresh the page
    window.location.reload();
  }

  return response;
}

// Re-export types for convenience
export type { Organization, Project, Brand, CreateProjectRequest, CreateBrandRequest };
