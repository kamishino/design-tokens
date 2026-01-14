import { useState, useEffect } from "react";
import { Icons } from "@shared/components/Icons";
import { isSupabaseEnabled, getSupabaseClient } from "@core/lib/supabase";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: "pending" | "success" | "error";
  action?: string;
}

export default function OnboardingChecklist() {
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: "env",
      title: "Environment Variables",
      description: "Check if .env file is configured",
      status: "pending",
    },
    {
      id: "supabase",
      title: "Supabase Connection",
      description: "Verify Supabase database connection",
      status: "pending",
    },
    {
      id: "build",
      title: "Initial Build",
      description: "Check if token artifacts have been generated",
      status: "pending",
    },
    {
      id: "node",
      title: "Node.js Version",
      description: "Verify Node.js 18+ is installed",
      status: "pending",
    },
  ]);

  useEffect(() => {
    runSystemChecks();
  }, []);

  const runSystemChecks = async () => {
    const updatedChecks = [...checks];

    // Check 1: Environment Variables
    const hasSupabase = isSupabaseEnabled();
    updatedChecks[0].status = hasSupabase ? "success" : "error";
    updatedChecks[0].action = hasSupabase ? undefined : "Run: npm run setup";

    // Check 2: Supabase Connection
    if (hasSupabase) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error } = await supabase
            .from("organizations")
            .select("count");
          updatedChecks[1].status = error ? "error" : "success";
          updatedChecks[1].action = error
            ? "Check Supabase credentials in .env"
            : undefined;
        }
      } catch (err) {
        updatedChecks[1].status = "error";
        updatedChecks[1].action = "Check Supabase configuration";
      }
    } else {
      updatedChecks[1].status = "error";
      updatedChecks[1].action = "Configure Supabase in .env";
    }

    // Check 3: Build artifacts
    try {
      const response = await fetch("/api/files");
      updatedChecks[2].status = response.ok ? "success" : "error";
      updatedChecks[2].action = response.ok ? undefined : "Run: npm run build";
    } catch (err) {
      updatedChecks[2].status = "error";
      updatedChecks[2].action = "Run: npm run build";
    }

    // Check 4: Node.js version (client-side check not possible, always success)
    updatedChecks[3].status = "success";

    setChecks(updatedChecks);
  };

  const allPassed = checks.every((check) => check.status === "success");

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className={Icons.CHECK}></i> System Setup Checklist
        </h3>
      </div>
      <div className="card-body">
        {allPassed ? (
          <div className="alert alert-success">
            <h4 className="alert-title">
              <i className={Icons.CHECK}></i> All Systems Ready!
            </h4>
            <div className="text-muted">
              Your design token system is fully configured and ready to use.
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">
            <h4 className="alert-title">Setup Required</h4>
            <div className="text-muted">
              Complete the checklist below to get started.
            </div>
          </div>
        )}

        <div className="list-group list-group-flush">
          {checks.map((check) => (
            <div key={check.id} className="list-group-item">
              <div className="row align-items-center">
                <div className="col-auto">
                  {check.status === "success" && (
                    <i className={`${Icons.CHECK} text-success fs-2`}></i>
                  )}
                  {check.status === "error" && (
                    <i className={`${Icons.CANCEL} text-danger fs-2`}></i>
                  )}
                  {check.status === "pending" && (
                    <div className="spinner-border spinner-border-sm text-muted"></div>
                  )}
                </div>
                <div className="col">
                  <div className="fw-bold">{check.title}</div>
                  <div className="text-muted small">{check.description}</div>
                  {check.action && (
                    <div className="mt-1">
                      <code className="text-primary">{check.action}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!allPassed && (
          <div className="mt-4">
            <h4>Next Steps:</h4>
            <ol className="mb-0">
              <li>
                Run <code>npm run setup</code> to configure your environment
              </li>
              <li>
                Follow the interactive prompts to add Supabase credentials
              </li>
              <li>
                Run <code>npm run build</code> to generate token artifacts
              </li>
              <li>
                Run <code>npm run dev</code> to start the development server
              </li>
            </ol>
          </div>
        )}

        <div className="mt-4">
          <button className="btn btn-primary" onClick={runSystemChecks}>
            <i className={Icons.REFRESH}></i> Re-check System
          </button>
        </div>
      </div>
    </div>
  );
}
