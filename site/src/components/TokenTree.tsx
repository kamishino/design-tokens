import { useState, useRef, useMemo } from "react";
import { TokenContent, TokenValue } from "../types";
import { Icons } from "./Icons";
import Swatch from "./Swatch";
import AliasPicker from "./AliasPicker";
import Autocomplete from "./Autocomplete";
import InlineValue from "./InlineValue";
import { DimensionEditor, ShadowEditor, TypographyEditor } from "./TypeEditors";
import {
  isTokenReference,
  extractReferencePath,
  resolveToken,
  isHexColor,
  normalizeHexColor,
  getTokenUsageCount,
  getMergedKeys,
  compareTokenValues,
  TokenStatus,
  isGroupModified,
} from "../utils/token-logic";

interface TokenTreeProps {
  data: TokenContent;
  path: string[];
  onUpdate: (path: string[], newValue: any) => void;
  expandAll?: boolean;
  allTokens?: Record<string, TokenContent>;
  onNavigateToToken?: (tokenPath: string) => void;
  baselineContent?: TokenContent | null;
  onRevertToken?: (path: string[]) => void;
  onDeleteToken?: (path: string[]) => void;
}

export default function TokenTree({
  data,
  path,
  onUpdate,
  expandAll,
  allTokens = {},
  onNavigateToToken,
  baselineContent = null,
  onRevertToken,
  onDeleteToken,
}: TokenTreeProps) {
  // Use merged keys to include deleted tokens
  const keys = getMergedKeys(data, baselineContent);

  return (
    <div className="list-group list-group-flush">
      {keys.map((key) => {
        const currentValue = data?.[key];
        const baselineValue = baselineContent?.[key];

        return (
          <TokenNode
            key={key}
            nodeKey={key}
            value={currentValue}
            baselineValue={baselineValue}
            path={[...path, key]}
            onUpdate={onUpdate}
            expandAll={expandAll}
            allTokens={allTokens}
            onNavigateToToken={onNavigateToToken}
            baselineContent={baselineContent}
            onRevertToken={onRevertToken}
            onDeleteToken={onDeleteToken}
          />
        );
      })}
    </div>
  );
}

interface TokenNodeProps {
  nodeKey: string;
  value: any;
  baselineValue?: any;
  path: string[];
  onUpdate: (path: string[], newValue: any) => void;
  expandAll?: boolean;
  allTokens?: Record<string, TokenContent>;
  onNavigateToToken?: (tokenPath: string) => void;
  baselineContent?: TokenContent | null;
  onRevertToken?: (path: string[]) => void;
  onDeleteToken?: (path: string[]) => void;
}

function TokenNode({
  nodeKey,
  value,
  baselineValue,
  path,
  onUpdate,
  expandAll,
  allTokens = {},
  onNavigateToToken,
  baselineContent = null,
  onRevertToken,
  onDeleteToken,
}: TokenNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAliasPicker, setShowAliasPicker] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [useTypeEditor, setUseTypeEditor] = useState(false);

  // Sync with parent expand/collapse control
  useState(() => {
    if (expandAll !== undefined) {
      setIsExpanded(expandAll);
    }
  });

  // Determine if this is a deleted token
  const isDeleted = !value && baselineValue;
  const effectiveValue = isDeleted ? baselineValue : value;

  const isLeafToken = isTokenValue(effectiveValue);
  const isGroup =
    typeof effectiveValue === "object" &&
    effectiveValue !== null &&
    !isLeafToken;

  // Calculate token status by comparing values directly
  const tokenStatus = compareTokenValues(value, baselineValue);

  if (isLeafToken) {
    const tokenValueStr = String(effectiveValue.$value || effectiveValue.value);
    const isReference = isTokenReference(tokenValueStr);
    const resolved = isReference
      ? resolveToken(effectiveValue, allTokens)
      : null;
    const tokenType = (
      effectiveValue.$type ||
      effectiveValue.type ||
      ""
    ).toLowerCase();
    const isColorToken = tokenType === "color" && !isReference;
    const tokenPath = path.join(".");
    const usageCount = getTokenUsageCount(tokenPath, allTokens);

    // Check if type-specific editor is available
    const hasTypeEditor = [
      "dimension",
      "sizing",
      "spacing",
      "shadow",
      "boxshadow",
      "typography",
      "fontfamily",
      "fontsizes",
      "fontweights",
      "lineheights",
      "fontfamilies",
    ].includes(tokenType);

    // Handler for color picker
    const handleColorChange = (e: React.FormEvent<HTMLInputElement>) => {
      setPendingValue(e.currentTarget.value);
      setValidationError(null);
    };

    const handleColorCommit = (e: React.FormEvent<HTMLInputElement>) => {
      const normalized = normalizeHexColor(e.currentTarget.value);
      if (isHexColor(normalized)) {
        onUpdate(path, {
          ...effectiveValue,
          [effectiveValue?.$value !== undefined ? "$value" : "value"]:
            normalized,
        });
        setPendingValue(null);
        setValidationError(null);
      } else {
        setValidationError("Invalid HEX color format");
      }
    };

    const handleSwatchClick = () => {
      if (isColorToken && colorInputRef.current) {
        colorInputRef.current.click();
      }
    };

    return (
      <>
        <div className="list-group-item">
          <div className="row align-items-center">
            {/* Visual Swatch */}
            <div className="col-auto">
              <Swatch
                token={effectiveValue}
                resolvedValue={resolved?.resolvedValue}
                tempValue={pendingValue}
                onClick={
                  isColorToken && !isDeleted ? handleSwatchClick : undefined
                }
              />
              {/* Hidden color picker input */}
              {isColorToken && !isDeleted && (
                <input
                  ref={colorInputRef}
                  type="color"
                  className="d-none"
                  value={pendingValue || tokenValueStr}
                  onInput={handleColorChange}
                  onChange={handleColorCommit}
                />
              )}
            </div>

            {/* Token Name */}
            <div className="col-auto">
              <span
                className="badge bg-blue text-white"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.5rem",
                  fontWeight: "600",
                  lineHeight: "1.2",
                }}
              >
                {nodeKey}
              </span>
            </div>

            {/* Token Value */}
            <div className="col">
              {isEditing && !isDeleted ? (
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  {useTypeEditor && hasTypeEditor ? (
                    <div className="w-100">
                      <div className="mb-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setUseTypeEditor(false)}
                          title="Back to text editor"
                        >
                          <i className="ti ti-arrow-left me-1"></i>
                          Back to Text Editor
                        </button>
                      </div>
                      {(tokenType === "dimension" ||
                        tokenType === "sizing" ||
                        tokenType === "spacing") && (
                        <DimensionEditor
                          value={pendingValue || tokenValueStr}
                          onChange={(v) => setPendingValue(v)}
                          onCommit={() => {
                            onUpdate(path, {
                              ...value,
                              [value.$value !== undefined ? "$value" : "value"]:
                                pendingValue || tokenValueStr,
                            });
                            setIsEditing(false);
                            setUseTypeEditor(false);
                          }}
                        />
                      )}
                      {(tokenType === "shadow" ||
                        tokenType === "boxshadow") && (
                        <ShadowEditor
                          value={pendingValue || tokenValueStr}
                          onChange={(v) => setPendingValue(v)}
                          onCommit={() => {
                            onUpdate(path, {
                              ...value,
                              [value.$value !== undefined ? "$value" : "value"]:
                                pendingValue || tokenValueStr,
                            });
                            setIsEditing(false);
                            setUseTypeEditor(false);
                          }}
                        />
                      )}
                      {(tokenType === "typography" ||
                        tokenType === "fontfamily") && (
                        <TypographyEditor
                          value={value.$value || value.value}
                          onChange={(v) =>
                            setPendingValue(
                              typeof v === "object" ? JSON.stringify(v) : v
                            )
                          }
                          onCommit={() => {
                            onUpdate(path, {
                              ...value,
                              [value.$value !== undefined ? "$value" : "value"]:
                                pendingValue || tokenValueStr,
                            });
                            setIsEditing(false);
                            setUseTypeEditor(false);
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${
                          validationError ? "is-invalid" : ""
                        }`}
                        defaultValue={pendingValue || tokenValueStr}
                        onBlur={(e) => {
                          const newValue = e.target.value;
                          if (isColorToken) {
                            const normalized = normalizeHexColor(newValue);
                            if (isHexColor(normalized)) {
                              onUpdate(path, {
                                ...effectiveValue,
                                [effectiveValue?.$value !== undefined
                                  ? "$value"
                                  : "value"]: normalized,
                              });
                              setPendingValue(null);
                              setValidationError(null);
                            } else {
                              setValidationError("Invalid HEX color format");
                            }
                          } else {
                            onUpdate(path, {
                              ...value,
                              [value.$value !== undefined ? "$value" : "value"]:
                                newValue,
                            });
                          }
                          setIsEditing(false);
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isColorToken) {
                            setPendingValue(val);
                            setValidationError(null);
                          }
                          // Trigger autocomplete on '{'
                          if (val.endsWith("{")) {
                            setShowAutocomplete(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          } else if (e.key === "Escape") {
                            setPendingValue(null);
                            setValidationError(null);
                            setIsEditing(false);
                          }
                        }}
                        autoFocus
                      />
                      {validationError && (
                        <div className="invalid-feedback">
                          {validationError}
                        </div>
                      )}
                    </>
                  )}
                  {!useTypeEditor && (
                    <>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setShowAliasPicker(true);
                          setIsEditing(false);
                        }}
                        title="Link to another token"
                      >
                        <i className="ti ti-link"></i>
                      </button>
                      {hasTypeEditor && !isReference && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            if (!pendingValue) {
                              setPendingValue(tokenValueStr);
                            }
                            setUseTypeEditor(true);
                          }}
                          title="Use advanced editor"
                        >
                          <i className="ti ti-forms"></i>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center gap-2">
                    {isReference ? (
                      <span
                        className={`badge ${
                          resolved?.isValid ? "bg-purple-lt" : "bg-red-lt"
                        }`}
                        onClick={() => {
                          if (resolved?.isValid && onNavigateToToken) {
                            onNavigateToToken(
                              extractReferencePath(tokenValueStr)
                            );
                          } else {
                            setIsEditing(true);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                        title={
                          resolved?.error || extractReferencePath(tokenValueStr)
                        }
                      >
                        {extractReferencePath(tokenValueStr)}
                        {!resolved?.isValid && (
                          <i className="ti ti-alert-circle ms-1"></i>
                        )}
                      </span>
                    ) : (
                      <>
                        <span
                          onClick={() => setIsEditing(true)}
                          style={{ cursor: "pointer" }}
                        >
                          <InlineValue
                            value={pendingValue || tokenValueStr}
                            type={tokenType}
                            className={isColorToken ? "fw-bold" : ""}
                          />
                        </span>
                        {isColorToken && (
                          <button
                            className="btn btn-sm btn-link text-decoration-none p-0 ms-2"
                            onClick={handleSwatchClick}
                            title="Pick color"
                          >
                            <i className="ti ti-color-picker"></i>
                          </button>
                        )}
                      </>
                    )}
                    {validationError && (
                      <span
                        className="badge bg-danger ms-2"
                        title={validationError}
                      >
                        <i className="ti ti-alert-circle"></i> {validationError}
                      </span>
                    )}
                  </div>
                  {/* Resolved Value Display */}
                  {isReference && resolved?.isValid && (
                    <div className="text-muted small mt-1">
                      →{" "}
                      <InlineValue
                        value={resolved.resolvedValue}
                        type={tokenType}
                      />
                    </div>
                  )}
                  {/* Description */}
                  {effectiveValue?.$description && (
                    <div className="text-muted small mt-1">
                      {effectiveValue.$description}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right-aligned Metadata Block */}
            <div className="col-auto ms-auto d-flex align-items-center gap-2">
              {/* Status Icon */}
              {tokenStatus && (
                <StatusIcon
                  status={tokenStatus}
                  path={path}
                  baselineValue={baselineValue}
                  currentValue={value}
                  onRevert={onRevertToken}
                />
              )}

              {/* Usage Badge */}
              {usageCount > 0 && (
                <span
                  className="badge bg-green-lt"
                  title={`Referenced by ${usageCount} token(s)`}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.5rem",
                    fontWeight: "600",
                    lineHeight: "1.2",
                  }}
                >
                  <i className="ti ti-link"></i> {usageCount}
                </span>
              )}

              {/* Token Type */}
              {effectiveValue.$type && (
                <span
                  className="badge bg-azure text-white"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.5rem",
                    fontWeight: "600",
                    lineHeight: "1.2",
                  }}
                >
                  {effectiveValue.$type}
                </span>
              )}

              {/* Delete Button */}
              {!isDeleted && onDeleteToken && (
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDeleteToken(path)}
                  title="Delete token"
                >
                  <i className="ti ti-trash"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alias Picker Modal */}
        {showAliasPicker && (
          <AliasPicker
            allTokens={allTokens}
            currentValue={tokenValueStr}
            onSelect={(selectedPath) => {
              onUpdate(path, {
                ...value,
                [value.$value !== undefined ? "$value" : "value"]: selectedPath,
              });
              setShowAliasPicker(false);
            }}
            onClose={() => setShowAliasPicker(false)}
            filterType={effectiveValue?.$type || effectiveValue?.type}
          />
        )}

        {/* Autocomplete Modal */}
        {showAutocomplete && (
          <Autocomplete
            allTokens={allTokens}
            onSelect={(selectedPath) => {
              setPendingValue(selectedPath);
              setShowAutocomplete(false);
            }}
            onClose={() => setShowAutocomplete(false)}
            filterType={effectiveValue?.$type || effectiveValue?.type}
          />
        )}
      </>
    );
  }

  if (isGroup) {
    // Check if this group contains any modified tokens
    const hasModifications = useMemo(() => {
      return isGroupModified(value, baselineValue);
    }, [value, baselineValue]);

    return (
      <div className="list-group-item">
        <div
          className="d-flex align-items-center justify-content-between"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: "pointer" }}
        >
          <div className="d-flex align-items-center">
            <i
              className={
                (isExpanded ? Icons.CHEVRON_DOWN : Icons.CHEVRON_RIGHT) +
                " me-2"
              }
            ></i>
            <strong>{nodeKey}</strong>
            <span
              className="badge bg-secondary text-white ms-2"
              style={{
                fontSize: "0.75rem",
                padding: "0.35rem 0.5rem",
                fontWeight: "600",
                lineHeight: "1.2",
              }}
            >
              {
                Object.keys(effectiveValue).filter((k) => !k.startsWith("$"))
                  .length
              }{" "}
              items
            </span>
            {/* Group Modification Badge */}
            {hasModifications && (
              <span
                className="badge bg-yellow text-dark ms-2"
                title="This folder contains modified, new, or deleted tokens"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.5rem",
                  fontWeight: "600",
                  lineHeight: "1.2",
                }}
              >
                MOD
              </span>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="ms-3">
            <TokenTree
              data={value || {}}
              path={path}
              onUpdate={onUpdate}
              expandAll={isExpanded}
              allTokens={allTokens}
              onNavigateToToken={onNavigateToToken}
              baselineContent={baselineValue || null}
              onRevertToken={onRevertToken}
              onDeleteToken={onDeleteToken}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

interface StatusIconProps {
  status: TokenStatus;
  path: string[];
  baselineValue: any;
  currentValue: any;
  onRevert?: (path: string[]) => void;
}

function StatusIcon({
  status,
  path,
  baselineValue,
  currentValue,
  onRevert,
}: StatusIconProps) {
  const [showDiff, setShowDiff] = useState(false);

  if (!status) return null;

  const getIconClass = () => {
    switch (status) {
      case "NEW":
        return "ti ti-plus text-green";
      case "MODIFIED":
        return "ti ti-point-filled text-yellow";
      case "DELETED":
        return "ti ti-minus text-red";
      default:
        return "";
    }
  };

  const getIconTitle = () => {
    switch (status) {
      case "NEW":
        return "New token - Click to view";
      case "MODIFIED":
        return "Modified token - Click to view diff";
      case "DELETED":
        return "Deleted token - Click to view";
      default:
        return "";
    }
  };

  const handleIconClick = () => {
    setShowDiff(!showDiff);
  };

  const handleRevert = () => {
    if (onRevert) {
      onRevert(path);
      setShowDiff(false);
    }
  };

  return (
    <div className="d-inline-block position-relative">
      <i
        className={getIconClass()}
        style={{ cursor: "pointer", fontSize: "1.6rem" }}
        onClick={handleIconClick}
        title={getIconTitle()}
      ></i>

      {showDiff && (
        <div
          className="card position-absolute shadow-lg"
          style={{
            zIndex: 9999,
            minWidth: "350px",
            maxWidth: "450px",
            top: "100%",
            right: 0,
            marginTop: "8px",
          }}
        >
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center w-100">
              <strong>Token Diff</strong>
              <button
                className="btn-close"
                onClick={() => setShowDiff(false)}
              ></button>
            </div>
          </div>
          <div className="card-body">
            {status === "NEW" && (
              <div>
                <div className="fw-bold text-success mb-2">
                  <i className="ti ti-plus me-1"></i>New Value:
                </div>
                <div className="p-2 bg-success-lt rounded">
                  <code className="text-success">
                    {JSON.stringify(currentValue, null, 2)}
                  </code>
                </div>
              </div>
            )}
            {status === "MODIFIED" && (
              <div>
                <div className="fw-bold text-danger mb-1">
                  <i className="ti ti-minus me-1"></i>Original:
                </div>
                <div className="p-2 bg-danger-lt rounded mb-3">
                  <code className="text-danger">
                    {JSON.stringify(baselineValue, null, 2)}
                  </code>
                </div>
                <div className="fw-bold text-success mb-1">
                  <i className="ti ti-plus me-1"></i>Current:
                </div>
                <div className="p-2 bg-success-lt rounded">
                  <code className="text-success">
                    {JSON.stringify(currentValue, null, 2)}
                  </code>
                </div>
              </div>
            )}
            {status === "DELETED" && (
              <div>
                <div className="fw-bold text-danger mb-2">
                  <i className="ti ti-trash me-1"></i>Original Value:
                </div>
                <div className="p-2 bg-danger-lt rounded">
                  <code className="text-danger">
                    {JSON.stringify(baselineValue, null, 2)}
                  </code>
                </div>
              </div>
            )}

            {onRevert && (
              <div className="mt-3">
                <button
                  className="btn btn-sm btn-primary w-100"
                  onClick={handleRevert}
                >
                  <i className="ti ti-arrow-back-up me-1"></i>
                  Revert to Original
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isTokenValue(obj: any): obj is TokenValue {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj.$value !== undefined ||
      (obj.value !== undefined && obj.$type !== undefined))
  );
}
