import { useState } from "react";
import { TokenContent, TokenValue } from "../types";
import { Icons } from "./Icons";
import Swatch from "./Swatch";
import AliasPicker from "./AliasPicker";
import { isTokenReference, extractReferencePath, resolveToken } from "../utils/token-logic";

interface TokenTreeProps {
  data: TokenContent;
  path: string[];
  onUpdate: (path: string[], newValue: any) => void;
  expandAll?: boolean;
  allTokens?: Record<string, TokenContent>;
}

export default function TokenTree({ data, path, onUpdate, expandAll, allTokens = {} }: TokenTreeProps) {
  return (
    <div className="list-group list-group-flush">
      {Object.entries(data).map(([key, value]) => (
        <TokenNode key={key} nodeKey={key} value={value} path={[...path, key]} onUpdate={onUpdate} expandAll={expandAll} allTokens={allTokens} />
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
}

function TokenNode({ nodeKey, value, path, onUpdate, expandAll, allTokens = {} }: TokenNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAliasPicker, setShowAliasPicker] = useState(false);

  // Sync with parent expand/collapse control
  useState(() => {
    if (expandAll !== undefined) {
      setIsExpanded(expandAll);
    }
  });
  const [isEditing, setIsEditing] = useState(false);

  const isLeafToken = isTokenValue(value);
  const isGroup = typeof value === "object" && value !== null && !isLeafToken;

  if (isLeafToken) {
    const tokenValueStr = String(value.$value || value.value);
    const isReference = isTokenReference(tokenValueStr);
    const resolved = isReference ? resolveToken(value, allTokens) : null;

    return (
      <>
        <div className="list-group-item">
          <div className="row align-items-center">
            {/* Visual Swatch */}
            <div className="col-auto">
              <Swatch token={value} resolvedValue={resolved?.resolvedValue} />
            </div>

            {/* Token Name */}
            <div className="col-auto">
              <span className="badge bg-blue-lt">{nodeKey}</span>
            </div>

            {/* Token Value */}
            <div className="col">
              {isEditing ? (
                <div className="d-flex gap-2 align-items-center">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    defaultValue={tokenValueStr}
                    onBlur={(e) => {
                      onUpdate(path, {
                        ...value,
                        [value.$value !== undefined ? "$value" : "value"]: e.target.value,
                      });
                      setIsEditing(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      } else if (e.key === "Escape") {
                        setIsEditing(false);
                      }
                    }}
                    autoFocus
                  />
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
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center gap-2">
                    {isReference ? (
                      <span
                        className={`badge ${resolved?.isValid ? "bg-purple-lt" : "bg-red-lt"}`}
                        onClick={() => setIsEditing(true)}
                        style={{ cursor: "pointer" }}
                        title={resolved?.error || extractReferencePath(tokenValueStr)}
                      >
                        {extractReferencePath(tokenValueStr)}
                        {!resolved?.isValid && <i className="ti ti-alert-circle ms-1"></i>}
                      </span>
                    ) : (
                      <code className="text-primary" onClick={() => setIsEditing(true)} style={{ cursor: "pointer" }}>
                        {tokenValueStr}
                      </code>
                    )}
                  </div>
                  {/* Resolved Value Display */}
                  {isReference && resolved?.isValid && (
                    <div className="text-muted small mt-1">
                      → <code>{resolved.resolvedValue}</code>
                    </div>
                  )}
                  {/* Description */}
                  {value.$description && <div className="text-muted small mt-1">{value.$description}</div>}
                </div>
              )}
            </div>

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
            }}
            onClose={() => setShowAliasPicker(false)}
            filterType={value.$type || value.type}
          />
        )}
      </>
    );
  }

  if (isGroup) {
    return (
      <div className="list-group-item">
        <div className="d-flex align-items-center" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: "pointer" }}>
          <i className={(isExpanded ? Icons.CHEVRON_DOWN : Icons.CHEVRON_RIGHT) + " me-2"}></i>
          <strong>{nodeKey}</strong>
          <span className="badge bg-secondary-lt ms-2">{Object.keys(value).filter((k) => !k.startsWith("$")).length} items</span>
        </div>

        {isExpanded && (
          <div className="mt-2 ms-4">
            <TokenTree data={value} path={path} onUpdate={onUpdate} expandAll={expandAll} allTokens={allTokens} />
          </div>
        )}
      </div>
    );
  }

  return null;
}

function isTokenValue(obj: any): obj is TokenValue {
  return typeof obj === "object" && obj !== null && (obj.$value !== undefined || (obj.value !== undefined && obj.$type !== undefined));
}
