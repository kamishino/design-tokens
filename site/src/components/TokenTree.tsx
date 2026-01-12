import { useState } from "react";
import { TokenContent, TokenValue } from "../types";
import { Icons } from "./Icons";

interface TokenTreeProps {
  data: TokenContent;
  path: string[];
  onUpdate: (path: string[], newValue: any) => void;
  expandAll?: boolean;
}

export default function TokenTree({ data, path, onUpdate, expandAll }: TokenTreeProps) {
  return (
    <div className="list-group list-group-flush">
      {Object.entries(data).map(([key, value]) => (
        <TokenNode key={key} nodeKey={key} value={value} path={[...path, key]} onUpdate={onUpdate} expandAll={expandAll} />
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
}

function TokenNode({ nodeKey, value, path, onUpdate, expandAll }: TokenNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
    return (
      <div className="list-group-item">
        <div className="row align-items-center">
          <div className="col-auto">
            <span className="badge bg-blue-lt">{nodeKey}</span>
          </div>
          <div className="col">
            {isEditing ? (
              <input
                type="text"
                className="form-control form-control-sm"
                defaultValue={value.$value || value.value}
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
            ) : (
              <div onClick={() => setIsEditing(true)} style={{ cursor: "pointer" }}>
                <code className="text-primary">{value.$value || value.value}</code>
                {value.$description && <div className="text-muted small mt-1">{value.$description}</div>}
              </div>
            )}
          </div>
          {value.$type && (
            <div className="col-auto">
              <span className="badge bg-azure-lt">{value.$type}</span>
            </div>
          )}
        </div>
      </div>
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
            <TokenTree data={value} path={path} onUpdate={onUpdate} expandAll={expandAll} />
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
