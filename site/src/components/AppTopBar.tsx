import { Icons } from "./Icons";
import ProjectSwitcher from "./ProjectSwitcher";
import SandboxToggle from "./SandboxToggle";
import { isSupabaseEnabled } from "../lib/supabase";

interface AppTopBarProps {
  // Sandbox mode state
  isSandboxMode: boolean;
  onToggleSandbox: (enabled: boolean) => void;
  hasDraftChanges: boolean;
  draftChangeCount: number;

  // Project state
  activeProjectId: string | null;
  onProjectChange: (projectId: string) => void;

  // Publishing
  onPublish: () => void;
}

export default function AppTopBar({
  isSandboxMode,
  onToggleSandbox,
  hasDraftChanges,
  draftChangeCount,
  activeProjectId,
  onProjectChange,
  onPublish,
}: AppTopBarProps) {
  const handlePublish = () => {
    const changeText = draftChangeCount === 1 ? "change" : "changes";
    const confirmed = window.confirm(
      `Publish ${draftChangeCount} ${changeText} to production?\n\n` +
        `This will:\n` +
        `• Merge sandbox drafts into local JSON files\n` +
        `• Clear all sandbox drafts from Supabase\n` +
        `• Require a manual build (npm run build) to update artifacts\n\n` +
        `This action cannot be undone automatically.`
    );

    if (confirmed) {
      onPublish();
    }
  };

  // Don't render if Supabase is not enabled
  if (!isSupabaseEnabled()) {
    return null;
  }

  return (
    <div className="app-top-bar">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between h-100">
          {/* Left: Project Switcher */}
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <i className={Icons.BRAND + " text-primary"}></i>
              <span className="fw-bold text-muted small">Design Tokens</span>
            </div>

            <div className="vr"></div>

            <ProjectSwitcher
              activeProjectId={activeProjectId}
              onProjectChange={onProjectChange}
            />
          </div>

          {/* Right: Sandbox Toggle & Publish Button */}
          <div className="d-flex align-items-center gap-3">
            <SandboxToggle
              isSandboxMode={isSandboxMode}
              onToggle={onToggleSandbox}
              hasDraftChanges={hasDraftChanges}
            />

            {/* Publish Button - Only in Sandbox Mode */}
            {isSandboxMode && hasDraftChanges && (
              <>
                <div className="vr"></div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handlePublish}
                  title="Publish sandbox changes to production"
                >
                  <i className={Icons.UPLOAD + " me-1"}></i>
                  Publish
                  {draftChangeCount > 0 && (
                    <span className="badge bg-white text-primary ms-2">
                      {draftChangeCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
