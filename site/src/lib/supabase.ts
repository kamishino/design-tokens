import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables for Supabase connection
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Debug: Log environment variable status (remove after testing)
console.log("[Supabase Debug] URL:", SUPABASE_URL ? "✓ Loaded" : "✗ Missing");
console.log("[Supabase Debug] Key:", SUPABASE_ANON_KEY ? "✓ Loaded" : "✗ Missing");

// Database types
export interface Project {
  id: string;
  name: string;
  git_url: string;
  created_at?: string;
  updated_at?: string;
}

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

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  gitUrl: string
): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("projects")
      .insert({
        name,
        git_url: gitUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception creating project:", err);
    return null;
  }
}

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
