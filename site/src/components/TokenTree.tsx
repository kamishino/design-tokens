import { useState, useRef } from "react";
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
} from "../utils/token-logic";

interface TokenTreeProps {
  data: TokenContent;
  path: string[];
  onUpdate: (path: string[], newValue: any) => void;
  expandAll?: boolean;
  allTokens?: Record<string, TokenContent>;
  onNavigateToToken?: (tokenPath: string) => void;
}

export default function TokenTree({
  data,
  path,
  onUpdate,
  expandAll,
  allTokens = {},
  onNavigateToToken,
}: TokenTreeProps) {
  return (
    <div className="list-group list-group-flush">
      {Object.entries(data).map(([key, value]) => (
        <TokenNode
          key={key}
          nodeKey={key}
          value={value}
          path={[...path, key]}
          onUpdate={onUpdate}
          expandAll={expandAll}
          allTokens={allTokens}
          onNavigateToToken={onNavigateToToken}
        />
      ))}
    </div>
  );
}

interface TokenNodeProps {
  nodeKey: string;
  value: any;
  path: string[];
  onUpdate: (path: string[], newValue: any) => void;
  expandAll?: boolean;
  allTokens?: Record<string, TokenContent>;
  onNavigateToToken?: (tokenPath: string) => void;
}

function TokenNode({
  nodeKey,
  value,
  path,
  onUpdate,
  expandAll,
  allTokens = {},
  onNavigateToToken,
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

  const isLeafToken = isTokenValue(value);
  const isGroup = typeof value === "object" && value !== null && !isLeafToken;

  if (isLeafToken) {
    const tokenValueStr = String(value.$value || value.value);
    const isReference = isTokenReference(tokenValueStr);
    const resolved = isReference ? resolveToken(value, allTokens) : null;
    const tokenType = (value.$type || value.type || "").toLowerCase();
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
    const handleColorChange = (newColor: string) => {
      setPendingValue(newColor);
      setValidationError(null);
    };

    const handleColorCommit = (finalColor: string) => {
      const normalized = normalizeHexColor(finalColor);
      if (isHexColor(normalized)) {
        onUpdate(path, {
          ...value,
          [value.$value !== undefined ? "$value" : "value"]: normalized,
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
                token={value}
                resolvedValue={resolved?.resolvedValue}
                tempValue={pendingValue}
                onClick={isColorToken ? handleSwatchClick : undefined}
              />
              {/* Hidden color picker input */}
              {isColorToken && (
                <input
                  ref={colorInputRef}
                  type="color"
                  className="d-none"
                  value={pendingValue || tokenValueStr}
                  onChange={(e) => handleColorChange(e.target.value)}
                  onBlur={(e) => handleColorCommit(e.target.value)}
                />
              )}
            </div>

            {/* Token Name */}
            <div className="col-auto">
              <span className="badge bg-blue-lt">{nodeKey}</span>
            </div>

            {/* Token Value */}
            <div className="col">
              {isEditing ? (
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
                            handleColorCommit(newValue);
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
                  {value.$description && (
                    <div className="text-muted small mt-1">
                      {value.$description}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Usage Badge */}
            {usageCount > 0 && (
              <div className="col-auto">
                <span
                  className="badge bg-green-lt"
                  title={`Referenced by ${usageCount} token(s)`}
                >
                  <i className="ti ti-link"></i> {usageCount}
                </span>
              </div>
            )}

            {/* Token Type */}
            {value.$type && (
              <div className="col-auto">
                <span className="badge bg-azure-lt">{value.$type}</span>
              </div>
            )}
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
            filterType={value.$type || value.type}
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
            filterType={value.$type || value.type}
          />
        )}
      </>
    );
  }

  if (isGroup) {
    return (
      <div className="list-group-item">
        <div
          className="d-flex align-items-center"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: "pointer" }}
        >
          <i
            className={
              (isExpanded ? Icons.CHEVRON_DOWN : Icons.CHEVRON_RIGHT) + " me-2"
            }
          ></i>
          <strong>{nodeKey}</strong>
          <span className="badge bg-secondary-lt ms-2">
            {Object.keys(value).filter((k) => !k.startsWith("$")).length} items
          </span>
        </div>

        {isExpanded && (
          <div className="mt-2 ms-4">
            <TokenTree
              data={value}
              path={path}
              onUpdate={onUpdate}
              expandAll={expandAll}
              allTokens={allTokens}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

function isTokenValue(obj: any): obj is TokenValue {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj.$value !== undefined ||
      (obj.value !== undefined && obj.$type !== undefined))
  );
}
