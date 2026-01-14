// Supabase Edge Function: Trigger GitHub Actions Build
// PRD 0051: Automates token build via repository_dispatch

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { brand_id, version_number, changelog } = await req.json();

    if (!brand_id || !version_number) {
      return new Response(
        JSON.stringify({ error: "brand_id and version_number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify brand exists and get resolved tokens
    const { data: brandTokens, error: tokensError } = await supabase
      .rpc("resolve_brand_tokens", { target_brand_id: brand_id });

    if (tokensError) {
      throw new Error(`Failed to resolve brand tokens: ${tokensError.message}`);
    }

    // Create token version snapshot
    const { data: version, error: versionError } = await supabase
      .from("token_versions")
      .insert({
        brand_id,
        version_number,
        snapshot_json: brandTokens,
        changelog,
      })
      .select()
      .single();

    if (versionError) {
      throw new Error(`Failed to create version: ${versionError.message}`);
    }

    // Create release record
    const { data: release, error: releaseError } = await supabase
      .from("releases")
      .insert({
        version_id: version.id,
        status: "pending",
      })
      .select()
      .single();

    if (releaseError) {
      throw new Error(`Failed to create release: ${releaseError.message}`);
    }

    // Trigger GitHub Actions via repository_dispatch
    const githubToken = Deno.env.get("GITHUB_TOKEN")!;
    const githubRepo = Deno.env.get("GITHUB_REPOSITORY")!; // e.g., "owner/repo"

    const dispatchResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/dispatches`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${githubToken}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          event_type: "build-tokens",
          client_payload: {
            brand_id,
            version: version_number,
            release_id: release.id,
          },
        }),
      }
    );

    if (!dispatchResponse.ok) {
      const errorText = await dispatchResponse.text();
      throw new Error(`GitHub dispatch failed: ${errorText}`);
    }

    // Update release with GitHub trigger confirmation
    await supabase
      .from("releases")
      .update({ status: "building" })
      .eq("id", release.id);

    return new Response(
      JSON.stringify({
        success: true,
        version_id: version.id,
        release_id: release.id,
        version: version_number,
        message: "Build triggered successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
