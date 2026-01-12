interface CommitBarProps {
  changeCount: number;
  onCommit: () => void;
  onCancel: () => void;
  disabled: boolean;
}

export default function CommitBar({ changeCount, onCommit, onCancel, disabled }: CommitBarProps) {
  return (
    <div className="commit-bar">
      <div className="commit-bar-content">
        <div className="commit-info">
          <span className="change-indicator">●</span>
          <span className="change-text">
            {changeCount} file{changeCount !== 1 ? "s" : ""} modified
          </span>
        </div>

        <div className="commit-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={disabled}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onCommit} disabled={disabled}>
            {disabled ? "Committing..." : "Commit Changes & Build"}
          </button>
        </div>
      </div>
    </div>
  );
}
