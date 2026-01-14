/**
 * Find & Replace Modal
 * Global utility for bulk token value replacement
 */

import { useState } from "react";
import { TokenContent } from "@core/types";
import { findTokensByValue, findAndReplaceValue } from "@shared/utils/token-logic";
import { Icons } from "@shared/components/Icons";

interface FindReplaceModalProps {
  allTokens: Record<string, TokenContent>;
  onReplace: (updatedTokens: Record<string, TokenContent>) => void;
  onClose: () => void;
}

export default function FindReplaceModal({ allTokens, onReplace, onClose }: FindReplaceModalProps) {
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [preview, setPreview] = useState<Array<{ path: string; fileName: string; currentValue: any }> | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    if (!findValue.trim()) return;

    const matches = findTokensByValue(allTokens, findValue, useRegex);
    setPreview(matches);
    setShowPreview(true);
  };

  const handleReplace = () => {
    if (!findValue.trim() || !replaceValue.trim()) return;

    const { updatedTokens, replacementCount } = findAndReplaceValue(allTokens, findValue, replaceValue, useRegex);

    if (replacementCount > 0) {
      onReplace(updatedTokens);
      alert(`Replaced ${replacementCount} occurrence(s)`);
      onClose();
    } else {
      alert("No matches found to replace");
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={Icons.SEARCH + " me-2"}></i>
              Find & Replace
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Find Value</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., #FF0000 or {old.token.reference}"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
              />
              <div className="form-text">Enter the exact value or regex pattern to search for</div>
            </div>

            <div className="mb-3">
              <label className="form-label">Replace With</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., #00FF00 or {new.token.reference}"
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
              />
              <div className="form-text">Enter the new value or reference</div>
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="useRegex"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="useRegex">
                Use Regular Expression (Advanced)
              </label>
            </div>

            <div className="d-flex gap-2 mb-3">
              <button className="btn btn-outline-primary" onClick={handlePreview} disabled={!findValue.trim()}>
                <i className={Icons.SEARCH + " me-1"}></i>
                Preview Matches
              </button>
              {showPreview && preview && (
                <span className="badge bg-blue-lt align-self-center">
                  {preview.length} match(es) found
                </span>
              )}
            </div>

            {showPreview && preview && (
              <div className="card bg-light">
                <div className="card-header">
                  <strong>Preview</strong> - Tokens that will be affected
                </div>
                <div className="card-body p-0">
                  {preview.length === 0 ? (
                    <div className="p-3 text-muted text-center">No matches found</div>
                  ) : (
                    <div className="list-group list-group-flush" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {preview.map(({ path, fileName, currentValue }) => (
                        <div key={`${fileName}-${path}`} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <code className="text-primary">{path}</code>
                              <div className="text-muted small">{fileName}</div>
                            </div>
                            <div className="text-end small">
                              <div className="text-decoration-line-through text-muted">{currentValue}</div>
                              <div className="text-success fw-bold">→ {replaceValue || "(new value)"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleReplace}
              disabled={!findValue.trim() || !replaceValue.trim() || (showPreview && preview?.length === 0)}
            >
              <i className={Icons.EDIT + " me-1"}></i>
              Replace {showPreview && preview && preview.length > 0 ? `(${preview.length})` : "All"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

