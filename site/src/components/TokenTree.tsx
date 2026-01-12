import { useState } from "react";
import { TokenContent, TokenValue } from "../types";

interface TokenTreeProps {
  data: TokenContent;
  path: string[];
  onUpdate: (path: string[], newValue: any) => void;
}

export default function TokenTree({ data, path, onUpdate }: TokenTreeProps) {
  return (
    <div className="token-tree">
      {Object.entries(data).map(([key, value]) => (
        <TokenNode key={key} nodeKey={key} value={value} path={[...path, key]} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

interface TokenNodeProps {
  nodeKey: string;
  value: any;
  path: string[];
  onUpdate: (path: string[], newValue: any) => void;
}

function TokenNode({ nodeKey, value, path, onUpdate }: TokenNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const isLeafToken = isTokenValue(value);
  const isGroup = typeof value === "object" && value !== null && !isLeafToken;

  if (isLeafToken) {
    return (
      <div className="token-node token-leaf">
        <div className="token-header">
          <span className="token-key">{nodeKey}</span>
          {value.$type && <span className="token-type">{value.$type}</span>}
        </div>

        {isEditing ? (
          <div className="token-edit-form">
            <input
              type="text"
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
          </div>
        ) : (
          <div className="token-value" onClick={() => setIsEditing(true)}>
            <span className="value-display">{value.$value || value.value}</span>
            {value.$description && <span className="value-description">{value.$description}</span>}
          </div>
        )}
      </div>
    );
  }

  if (isGroup) {
    return (
      <div className="token-node token-group">
        <button className="token-header" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
          <span className="token-key">{nodeKey}</span>
          <span className="token-count">{Object.keys(value).filter((k) => !k.startsWith("$")).length} items</span>
        </button>

        {isExpanded && (
          <div className="token-children">
            <TokenTree data={value} path={path} onUpdate={onUpdate} />
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
