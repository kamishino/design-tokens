import { Icons } from "./Icons";
import { isSupabaseEnabled } from "../lib/supabase";

interface SandboxToggleProps {
  isSandboxMode: boolean;
  onToggle: (enabled: boolean) => void;
  hasDraftChanges: boolean;
}

export default function SandboxToggle({
  isSandboxMode,
  onToggle,
  hasDraftChanges,
}: SandboxToggleProps) {
  // Don't render if Supabase is not configured
  if (!isSupabaseEnabled()) {
    return null;
  }

  return (
    <div className="d-flex align-items-center gap-2">
      {/* Mode Indicator */}
      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small">Mode:</span>
        <span
          className={`badge ${
            isSandboxMode ? "bg-warning-lt" : "bg-success-lt"
          }`}
        >
          {isSandboxMode ? (
            <>
              <i className={Icons.FLASK + " me-1"}></i>
              Sandbox
            </>
          ) : (
            <>
              <i className={Icons.GIT + " me-1"}></i>
              Production
            </>
          )}
        </span>
      </div>

      {/* Toggle Switch */}
      <label className="form-check form-switch mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          checked={isSandboxMode}
          onChange={(e) => onToggle(e.target.checked)}
          title={
            isSandboxMode
              ? "Switch to Production (read-only Git tokens)"
              : "Switch to Sandbox (collaborative editing)"
          }
        />
        <span className="form-check-label small text-muted">
          {isSandboxMode ? "Editing" : "Viewing"}
        </span>
      </label>

      {/* Draft Changes Indicator */}
      {isSandboxMode && hasDraftChanges && (
        <span className="badge bg-orange-lt" title="Unpublished changes">
          <i className={Icons.ALERT + " me-1"}></i>
          Unsaved
        </span>
      )}
    </div>
  );
}
