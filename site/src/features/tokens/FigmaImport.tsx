/**
 * FigmaImport Component
 * Interface for importing and validating Figma Token Studio JSON
 */

import { useState } from "react";
import { TokenContent } from "@core/types";
import { validateTokenStructure, ValidationError, ValidationWarning } from "@shared/utils/token-logic";
import { diffTokens, TokenDiff, applyDiffs } from "@shared/utils/diff-logic";
import { Icons } from "@shared/components/Icons";

interface FigmaImportProps {
  onImport: (data: Record<string, TokenContent>) => void;
  onClose: () => void;
  currentTokens?: Record<string, TokenContent>;
}

export default function FigmaImport({ onImport, onClose, currentTokens = {} }: FigmaImportProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, TokenContent> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<TokenDiff[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [showDiff, setShowDiff] = useState(false);

  const handleValidate = () => {
    try {
      // Parse JSON
      const parsed = JSON.parse(jsonInput);
      setParseError(null);
      setParsedData(parsed);

      // Validate structure
      const result = validateTokenStructure(parsed);
      setValidationResult({
        errors: result.errors,
        warnings: result.warnings,
      });

      // Generate diffs
      if (result.errors.length === 0) {
        const tokenDiffs = diffTokens(currentTokens, parsed);
        setDiffs(tokenDiffs);
        // Select added and modified by default
        const defaultSelected = new Set(tokenDiffs.filter((d) => d.status === "added" || d.status === "modified").map((d) => d.path));
        setSelectedPaths(defaultSelected);
        setShowDiff(true);
      }
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON format");
      setParsedData(null);
      setValidationResult(null);
      setShowDiff(false);
    }
  };

  const handleImport = () => {
    if (parsedData && validationResult && validationResult.errors.length === 0) {
      // Apply only selected diffs
      const updated = applyDiffs(currentTokens, diffs, selectedPaths);
      onImport(updated);
      onClose();
    }
  };

  const togglePath = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedPaths.size === diffs.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(diffs.map((d) => d.path)));
    }
  };

  const canImport = parsedData && validationResult && validationResult.errors.length === 0;

  return (
    <div className="figma-import-overlay" onClick={onClose}>
      <div className="figma-import-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <h3 className="card-title">
            <i className={Icons.UPLOAD + " me-2"}></i>
            Import from Figma Tokens Studio
          </h3>
          <button className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>

        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Paste Figma Token Studio JSON</label>
            <textarea
              className={`form-control font-monospace ${parseError ? "is-invalid" : ""}`}
              rows={12}
              placeholder='{"colors": {"primary": {"$value": "#0066cc", "$type": "color"}}}'
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setParseError(null);
                setValidationResult(null);
                setParsedData(null);
              }}
              style={{ fontSize: "13px" }}
            />
            {parseError && (
              <div className="invalid-feedback d-block">
                <i className={Icons.ERROR + " me-1"}></i>
                {parseError}
              </div>
            )}
          </div>

          <button className="btn btn-primary mb-3" onClick={handleValidate} disabled={!jsonInput.trim()}>
            <i className={Icons.CHECK + " me-1"}></i>
            Validate JSON
          </button>

          {/* Validation Errors */}
          {validationResult && validationResult.errors.length > 0 && (
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-title">
                <i className={Icons.ERROR + " me-2"}></i>
                {validationResult.errors.length} Error(s) Found
              </h4>
              <ul className="mb-0">
                {validationResult.errors.slice(0, 10).map((error, idx) => (
                  <li key={idx}>
                    <strong>{error.path}:</strong> {error.message}
                  </li>
                ))}
                {validationResult.errors.length > 10 && <li className="text-muted">... and {validationResult.errors.length - 10} more</li>}
              </ul>
            </div>
          )}

          {/* Diff View - Review Changes */}
          {validationResult && validationResult.errors.length === 0 && diffs.length > 0 && (
            <div className="diff-view">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <i className={Icons.FILES + " me-2"}></i>
                  Review Changes ({selectedPaths.size}/{diffs.length} selected)
                </h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={toggleAll}>
                  {selectedPaths.size === diffs.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="table-responsive" style={{ maxHeight: "300px", overflow: "auto" }}>
                <table className="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}></th>
                      <th>Token Path</th>
                      <th>Status</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.map((diff) => (
                      <tr key={diff.path} className={!selectedPaths.has(diff.path) ? "text-muted" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedPaths.has(diff.path)}
                            onChange={() => togglePath(diff.path)}
                          />
                        </td>
                        <td>
                          <code className="small">{diff.path}</code>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              diff.status === "added"
                                ? "bg-green-lt"
                                : diff.status === "modified"
                                ? "bg-yellow-lt"
                                : diff.status === "removed"
                                ? "bg-red-lt"
                                : "bg-secondary-lt"
                            }`}
                          >
                            {diff.status}
                          </span>
                        </td>
                        <td>
                          <code className="small text-muted">{diff.oldValue !== undefined ? String(diff.oldValue) : "-"}</code>
                        </td>
                        <td>
                          <code className="small text-primary">{diff.newValue !== undefined ? String(diff.newValue) : "-"}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validationResult.warnings.length > 0 && (
                <div className="alert alert-warning alert-sm mt-3" role="alert">
                  <i className={Icons.WARNING + " me-2"}></i>
                  <strong>{validationResult.warnings.length} Warning(s)</strong> - Import will proceed but review recommended.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card-footer d-flex justify-content-between">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleImport} disabled={!canImport || selectedPaths.size === 0}>
            <i className={Icons.UPLOAD + " me-1"}></i>
            Import {selectedPaths.size} Token{selectedPaths.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>

      <style>{`
        .figma-import-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }

        .figma-import-modal {
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .validation-results {
          max-height: 300px;
          overflow-y: auto;
        }

        .validation-results ul {
          padding-left: 1.5rem;
        }

        .validation-results li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}

