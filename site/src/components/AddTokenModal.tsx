import { useState, useEffect, useMemo, useRef } from "react";
import { TokenContent } from "../types";
import {
  validateTokenName,
  getDefaultValueForType,
  isTokenReference,
  resolveToken,
  extractReferencePath,
  parseSlashPath,
  slashPathToDotPath,
} from "../utils/token-logic";
import { Icons } from "./Icons";
import AliasPicker from "./AliasPicker";
import Autocomplete from "./Autocomplete";

type CreationMode = "file" | "group" | "token";
type TokenCategory = "primitives" | "semantic" | "themes";

// W3C Design Token Community Group types
const TOKEN_TYPES = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "number",
  "string",
] as const;

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: CreationMode;
  // Pre-filled context from UI
  targetFile?: string | null;
  targetPath?: string;
  allTokensContent: Record<string, TokenContent>;
  // Callbacks
  onCreateFile: (category: TokenCategory, filename: string) => void;
  onCreateGroup: (filePath: string, path: string, groupName: string) => void;
  onCreateToken: (
    filePath: string,
    path: string,
    tokenName: string,
    tokenData: { $type: string; $value: any; $description?: string }
  ) => void;
}

export default function AddTokenModal({
  isOpen,
  onClose,
  mode,
  targetFile,
  targetPath = "",
  allTokensContent,
  onCreateFile,
  onCreateGroup,
  onCreateToken,
}: AddTokenModalProps) {
  // File mode state
  const [category, setCategory] = useState<TokenCategory>("primitives");
  const [filename, setFilename] = useState("");

  // Group mode state
  const [groupName, setGroupName] = useState("");

  // Token mode state
  const [tokenName, setTokenName] = useState("");
  const [tokenType, setTokenType] = useState<string>("color");
  const [tokenValue, setTokenValue] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<string>("");

  // Reference support state
  const [showAliasPicker, setShowAliasPicker] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const valueInputRef = useRef<HTMLInputElement>(null);

  // Validation state
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [forceCreate, setForceCreate] = useState(false);

  // Real-time token resolution for reference preview
  const resolvedValue = useMemo(() => {
    if (mode !== "token" || !tokenValue.trim()) return null;

    const isRef = isTokenReference(tokenValue);
    if (!isRef) return null;

    // Create a temporary token object for resolution
    const tempToken = { $value: tokenValue, $type: tokenType };
    const resolved = resolveToken(tempToken, allTokensContent);

    return {
      value: resolved.resolvedValue,
      isValid: resolved.isValid,
      path: extractReferencePath(tokenValue),
    };
  }, [tokenValue, tokenType, allTokensContent, mode]);

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setFilename("");
      setGroupName("");
      setTokenName("");
      setTokenValue("");
      setTokenDescription("");
      setError(null);
      setValidationErrors([]);
      setForceCreate(false);
      setCategory("primitives");
      setTokenType("color");
      setShowAliasPicker(false);
      setShowAutocomplete(false);

      // Pre-fill selectedFile if targetFile is provided
      if (targetFile) {
        setSelectedFile(targetFile);
      } else if (mode !== "file" && Object.keys(allTokensContent).length > 0) {
        setSelectedFile(Object.keys(allTokensContent)[0]);
      }
    }
  }, [isOpen, mode, targetFile, allTokensContent]);

  // Check if key already exists at target path
  const checkDuplicate = (name: string): boolean => {
    if (mode === "file") {
      const fullPath = `tokens/${category}/${name}.json`;
      return fullPath in allTokensContent;
    }

    if (mode === "group" || mode === "token") {
      const file = targetFile || selectedFile;
      if (!file || !allTokensContent[file]) return false;

      const pathParts = targetPath ? targetPath.split(".") : [];
      let current = allTokensContent[file];

      // Navigate to target location
      for (const part of pathParts) {
        if (current[part] && typeof current[part] === "object") {
          current = current[part];
        } else {
          return false;
        }
      }

      return name in current;
    }

    return false;
  };

  const handleCreate = () => {
    setError(null);

    if (mode === "file") {
      // Validate filename
      if (!filename.trim()) {
        setError("Filename is required");
        return;
      }
      if (!validateTokenName(filename)) {
        setError(
          "Filename must be lowercase alphanumeric with hyphens only (e.g., primary-colors)"
        );
        return;
      }
      if (checkDuplicate(filename)) {
        setError("A file with this name already exists");
        return;
      }

      onCreateFile(category, filename);
      onClose();
    } else if (mode === "group") {
      // Validate group name
      if (!groupName.trim()) {
        setError("Group name is required");
        return;
      }
      if (!validateTokenName(groupName)) {
        setError(
          "Group name must be lowercase alphanumeric with hyphens only (e.g., button-primary)"
        );
        return;
      }
      if (checkDuplicate(groupName)) {
        setError("A group with this name already exists at this location");
        return;
      }

      const file = targetFile || selectedFile;
      if (!file) {
        setError("No file selected");
        return;
      }

      onCreateGroup(file, targetPath, groupName);
      onClose();
    } else if (mode === "token") {
      // Validate token
      if (!tokenName.trim()) {
        setError("Token name is required");
        return;
      }
      if (!validateTokenName(tokenName)) {
        if (!forceCreate) {
          setError(
            "Token name must be lowercase alphanumeric with hyphens only (e.g., primary-500). Check 'Force Create' to override."
          );
          return;
        }
      }
      if (checkDuplicate(tokenName)) {
        setError("A token with this name already exists at this location");
        return;
      }

      const file = targetFile || selectedFile;
      if (!file) {
        setError("No file selected");
        return;
      }

      // Use provided value or fallback to default
      const finalValue = tokenValue.trim() || getDefaultValueForType(tokenType);

      const tokenData = {
        $type: tokenType,
        $value: finalValue,
        ...(tokenDescription.trim() && {
          $description: tokenDescription.trim(),
        }),
      };

      onCreateToken(file, targetPath, tokenName, tokenData);
      onClose();
    }
  };

  // Initialize tooltips when modal opens (required for dynamically rendered React components)
  useEffect(() => {
    if (isOpen) {
      // Initialize Bootstrap tooltips using Tabler's included Bootstrap JS
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      );
      const tooltips = Array.from(tooltipTriggerList).map(
        (tooltipTriggerEl) => {
          // @ts-ignore - Bootstrap is loaded via Tabler CDN
          return new window.bootstrap.Tooltip(tooltipTriggerEl);
        }
      );

      // Cleanup tooltips when modal closes
      return () => {
        tooltips.forEach((tooltip) => tooltip.dispose());
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (mode) {
      case "file":
        return "Add New Token Set";
      case "group":
        return "Add New Group";
      case "token":
        return "Add New Token";
    }
  };

  const getModalIcon = () => {
    switch (mode) {
      case "file":
        return Icons.FILE_CODE;
      case "group":
        return Icons.LAYERS;
      case "token":
        return Icons.ADD;
    }
  };

  return (
    <div className="modal modal-blur fade show d-block" tabIndex={-1}>
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ zIndex: 1050, maxWidth: "650px" }}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={getModalIcon() + " me-2"}></i>
              {getModalTitle()}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className={Icons.ALERT + " me-2"}></i>
                {error}
              </div>
            )}

            {/* FILE MODE */}
            {mode === "file" && (
              <>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as TokenCategory)
                    }
                  >
                    <option value="primitives">Primitives</option>
                    <option value="semantic">Semantic</option>
                    <option value="themes">Themes</option>
                  </select>
                  <div className="form-hint">
                    The category determines the folder location: tokens/
                    {category}/
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Filename</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., colors, spacing, typography"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    autoFocus
                  />
                  <div className="form-hint">
                    Will be saved as: tokens/{category}/{filename}.json
                  </div>
                </div>
              </>
            )}

            {/* GROUP MODE */}
            {mode === "group" && (
              <>
                {!targetFile && (
                  <div className="mb-3">
                    <label className="form-label">Target File</label>
                    <select
                      className="form-select"
                      value={selectedFile}
                      onChange={(e) => setSelectedFile(e.target.value)}
                    >
                      {Object.keys(allTokensContent).map((file) => (
                        <option key={file} value={file}>
                          {file.split("/").pop()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(targetFile || selectedFile) && (
                  <div className="alert alert-info mb-3">
                    <strong>Location:</strong> {targetFile || selectedFile}
                    {targetPath && ` → ${targetPath}`}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Group Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., primary, spacing, font-size"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    autoFocus
                  />
                  <div className="form-hint">
                    Use lowercase with hyphens (e.g., button-primary)
                  </div>
                </div>
              </>
            )}

            {/* TOKEN MODE */}
            {mode === "token" && (
              <>
                {!targetFile && (
                  <div className="mb-3">
                    <label className="form-label">Target File</label>
                    <select
                      className="form-select"
                      value={selectedFile}
                      onChange={(e) => setSelectedFile(e.target.value)}
                    >
                      {Object.keys(allTokensContent).map((file) => (
                        <option key={file} value={file}>
                          {file.split("/").pop()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(targetFile || selectedFile) && (
                  <div className="alert alert-info mb-3">
                    <strong>Location:</strong> {targetFile || selectedFile}
                    {targetPath && ` → ${targetPath}`}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    Token Name
                    <span
                      className="ms-2 text-muted"
                      style={{ cursor: "help" }}
                      data-bs-toggle="tooltip"
                      data-bs-placement="right"
                      data-bs-html="true"
                      data-bs-title="<strong>Token Name Rules:</strong><br/><br/>✓ Lowercase letters (a-z)<br/>✓ Numbers (0-9)<br/>✓ Hyphens (-) for word separation<br/>✓ Slashes (/) for nested groups<br/><br/><strong>Valid Examples:</strong><br/>• primary-500 - Simple token<br/>• button/primary - Nested (2 levels)<br/>• button/primary/bg - Deep nested<br/><br/><strong>Invalid:</strong><br/>✗ Primary-500 (uppercase)<br/>✗ primary_500 (underscore)<br/>✗ primary.500 (dot not allowed)"
                    >
                      <i
                        className="ti ti-help-circle"
                        style={{ fontSize: "16px" }}
                      ></i>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., primary-500 or button/primary/bg"
                    value={tokenName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setTokenName(name);

                      // Real-time validation
                      const errors: string[] = [];
                      if (name.trim() && !validateTokenName(name)) {
                        errors.push(
                          "Token name must be lowercase alphanumeric with hyphens/slashes only"
                        );
                      }
                      if (name.trim() && checkDuplicate(name)) {
                        errors.push(
                          "A token with this name already exists at this location"
                        );
                      }
                      setValidationErrors(errors);
                    }}
                    autoFocus
                  />

                  {/* Inline Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="mt-2">
                      {validationErrors.map((err, idx) => (
                        <div key={idx} className="text-danger small">
                          <i className={Icons.ALERT + " me-1"}></i>
                          {err}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Calculated Path Preview */}
                  {tokenName.includes("/") && (
                    <div className="form-hint mt-2">
                      <i className={Icons.INFO + " me-1"}></i>
                      Calculated path:{" "}
                      <strong>{slashPathToDotPath(tokenName)}</strong>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={tokenType}
                    onChange={(e) => setTokenType(e.target.value)}
                  >
                    {TOKEN_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Value</label>

                  {/* Flex-based Value Row: 10/80/10 (color) or 90/10 (others) */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {/* Color Picker (10% - only for color type and non-reference) */}
                    {tokenType === "color" && !isTokenReference(tokenValue) && (
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={
                          tokenValue.match(/^#[0-9A-Fa-f]{6}$/)
                            ? tokenValue
                            : "#000000"
                        }
                        onChange={(e) => setTokenValue(e.target.value)}
                        title="Choose color"
                        style={{ flex: "0 0 10%", minWidth: "50px" }}
                      />
                    )}

                    {/* Text Input (80% for color, 90% for others) */}
                    <input
                      ref={valueInputRef}
                      type="text"
                      className="form-control"
                      placeholder={`e.g., ${getDefaultValueForType(
                        tokenType
                      )} or {color.primary}`}
                      value={tokenValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTokenValue(val);
                        if (val.endsWith("{")) {
                          setShowAutocomplete(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" && showAutocomplete) {
                          setShowAutocomplete(false);
                          e.stopPropagation();
                        }
                      }}
                      style={{ flex: "1" }}
                    />

                    {/* Alias Picker Button (10%) */}
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowAliasPicker(true)}
                      title="Pick an existing token reference"
                      style={{ flex: "0 0 10%", minWidth: "45px" }}
                    >
                      <i className="ti ti-link"></i>
                    </button>
                  </div>

                  {/* Resolution Preview */}
                  {resolvedValue && resolvedValue.isValid && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      {tokenType === "color" && resolvedValue.value && (
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "3px",
                            backgroundColor: String(resolvedValue.value),
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                      )}
                      <span className="text-muted small">
                        → {String(resolvedValue.value)}
                      </span>
                    </div>
                  )}

                  {/* Invalid Reference Warning */}
                  {resolvedValue && !resolvedValue.isValid && (
                    <div className="text-danger small mt-2">
                      <i className={Icons.ALERT + " me-1"}></i>
                      Reference not found: {resolvedValue.path}
                    </div>
                  )}

                  <div className="form-hint">
                    Leave empty to use default:{" "}
                    {getDefaultValueForType(tokenType)}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Brief description of this token's purpose"
                    value={tokenDescription}
                    onChange={(e) => setTokenDescription(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <div className="me-auto">
              {mode === "token" && validationErrors.length > 0 && (
                <label className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={forceCreate}
                    onChange={(e) => setForceCreate(e.target.checked)}
                  />
                  <span className="form-check-label text-warning">
                    <i className={Icons.WARNING + " me-1"}></i>
                    Force Create
                  </span>
                </label>
              )}
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreate}
            >
              <i className={Icons.CHECK + " me-1"}></i>
              Create
            </button>
          </div>
        </div>
      </div>

      {/* AliasPicker Modal */}
      {showAliasPicker && mode === "token" && (
        <AliasPicker
          allTokens={allTokensContent}
          currentValue={tokenValue}
          onSelect={(path) => {
            setTokenValue(`{${path}}`);
            setShowAliasPicker(false);
            valueInputRef.current?.focus();
          }}
          onClose={() => setShowAliasPicker(false)}
          filterType={tokenType}
        />
      )}

      {/* Autocomplete Dropdown */}
      {showAutocomplete && mode === "token" && (
        <Autocomplete
          allTokens={allTokensContent}
          onSelect={(path) => {
            setTokenValue(`{${path}}`);
            setShowAutocomplete(false);
            valueInputRef.current?.focus();
          }}
          onClose={() => setShowAutocomplete(false)}
          filterType={tokenType}
          searchQuery={tokenValue.replace(/\{$/, "")}
        />
      )}

      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      ></div>
    </div>
  );
}
