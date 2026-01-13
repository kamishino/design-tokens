import { useState, useMemo } from "react";
import { TokenContent } from "../types";
import {
  getUnifiedTokens,
  formatTokensForExport,
  getExportFilename,
} from "../utils/token-logic";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: string | null;
  selectedFileContent: TokenContent | null;
  allTokensContent: Record<string, TokenContent>;
}

type ExportScope = "current" | "all";

export default function ExportModal({
  isOpen,
  onClose,
  selectedFile,
  selectedFileContent,
  allTokensContent,
}: ExportModalProps) {
  const [exportScope, setExportScope] = useState<ExportScope>("all");
  const [copied, setCopied] = useState(false);

  // Compute the preview JSON based on scope
  const previewJSON = useMemo(() => {
    if (exportScope === "current" && selectedFileContent) {
      return formatTokensForExport(selectedFileContent);
    } else {
      const unified = getUnifiedTokens(allTokensContent);
      return formatTokensForExport(unified);
    }
  }, [exportScope, selectedFileContent, allTokensContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewJSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([previewJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getExportFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-blur fade show d-block" tabIndex={-1}>
      <div
        className="modal-dialog modal-xl modal-dialog-centered"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Export Tokens</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {/* Options Section */}
            <div className="mb-3">
              <label className="form-label">Export Scope</label>
              <div className="form-selectgroup">
                <label className="form-selectgroup-item">
                  <input
                    type="radio"
                    name="exportScope"
                    value="current"
                    className="form-selectgroup-input"
                    checked={exportScope === "current"}
                    onChange={() => setExportScope("current")}
                    disabled={!selectedFile}
                  />
                  <span className="form-selectgroup-label">
                    <i className="ti ti-file me-1"></i>
                    Current File
                    {selectedFile && (
                      <span className="text-muted ms-2">
                        ({selectedFile.split("/").pop()})
                      </span>
                    )}
                  </span>
                </label>
                <label className="form-selectgroup-item">
                  <input
                    type="radio"
                    name="exportScope"
                    value="all"
                    className="form-selectgroup-input"
                    checked={exportScope === "all"}
                    onChange={() => setExportScope("all")}
                  />
                  <span className="form-selectgroup-label">
                    <i className="ti ti-folders me-1"></i>
                    Entire System
                    <span className="text-muted ms-2">
                      ({Object.keys(allTokensContent).length} files)
                    </span>
                  </span>
                </label>
              </div>
              <div className="form-hint mt-2">
                <i className="ti ti-info-circle me-1"></i>
                Format: W3C Design Token (Source) - Compatible with Figma Token
                Studio
              </div>
            </div>

            {/* Preview Section */}
            <div className="mb-3">
              <label className="form-label">Preview</label>
              <div
                style={{
                  maxHeight: "400px",
                  overflow: "auto",
                  border: "1px solid var(--tblr-border-color)",
                  borderRadius: "var(--tblr-border-radius)",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    fontFamily: "Monaco, Consolas, monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {previewJSON}
                </pre>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleCopy}
            >
              <i className={`ti ${copied ? "ti-check" : "ti-copy"} me-1`}></i>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownload}
            >
              <i className="ti ti-download me-1"></i>
              Download JSON
            </button>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      ></div>
    </div>
  );
}
