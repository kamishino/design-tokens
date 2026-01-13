import { Icons } from "./Icons";

interface CommitBarProps {
  changeCount: number;
  onCommit: () => void;
  onCancel: () => void;
  disabled: boolean;
}

export default function CommitBar({ changeCount, onCommit, onCancel, disabled }: CommitBarProps) {
  return (
    <div className="navbar navbar-light sticky-bottom bg-white border-top shadow-lg">
      <div className="container-xl">
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center">
            <span className="status-dot status-dot-animated bg-green me-2"></span>
            <span className="text-muted">
              <strong>{changeCount}</strong> file{changeCount !== 1 ? "s" : ""} modified
            </span>
          </div>

          <div className="btn-list">
            <button className="btn btn-outline-secondary" onClick={onCancel} disabled={disabled}>
              <i className={Icons.CANCEL + " me-1"}></i>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onCommit} disabled={disabled}>
              {disabled ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Committing...
                </>
              ) : (
                <>
                  <i className={Icons.SAVE + " me-1"}></i>
                  Commit Changes & Build
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
