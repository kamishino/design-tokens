/**
 * AliasPicker Component
 * Searchable dropdown for selecting token references/aliases
 */

import { useState, useEffect, useRef } from "react";
import { TokenContent, TokenValue } from "../types";
import { getAllTokensFlattened, resolveToken, isTokenReference } from "../utils/token-logic";
import Swatch from "./Swatch";
import { Icons } from "./Icons";

interface AliasPickerProps {
  allTokens: Record<string, TokenContent>;
  currentValue?: string;
  onSelect: (tokenPath: string) => void;
  onClose: () => void;
  filterType?: string; // Filter by token type
}

export default function AliasPicker({ allTokens, currentValue, onSelect, onClose, filterType }: AliasPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTokens, setFilteredTokens] = useState<Array<{ path: string; token: TokenValue; fileName: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input on mount
    inputRef.current?.focus();

    // Get all tokens
    let tokens = getAllTokensFlattened(allTokens);

    // Filter by type if specified
    if (filterType) {
      tokens = tokens.filter((item) => {
        const type = (item.token.$type || item.token.type || "").toLowerCase();
        return type === filterType.toLowerCase();
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tokens = tokens.filter((item) => {
        const pathMatch = item.path.toLowerCase().includes(query);
        const descMatch = (item.token.$description || item.token.description || "").toLowerCase().includes(query);
        const valueMatch = String(item.token.$value || item.token.value || "")
          .toLowerCase()
          .includes(query);
        return pathMatch || descMatch || valueMatch;
      });
    }

    setFilteredTokens(tokens);
  }, [searchQuery, allTokens, filterType]);

  const handleSelect = (path: string) => {
    onSelect(`{${path}}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="alias-picker-overlay" onClick={onClose}>
      <div className="alias-picker-modal card" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="card-header">
          <h3 className="card-title">
            <i className={Icons.SEARCH + " me-2"}></i>
            Select Token Reference
          </h3>
          <button className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>

        <div className="card-body p-0">
          {/* Search Input */}
          <div className="p-3 border-bottom">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {filterType && (
              <div className="mt-2">
                <span className="badge bg-blue-lt">Filtering by type: {filterType}</span>
              </div>
            )}
          </div>

          {/* Token List */}
          <div className="alias-picker-list">
            {filteredTokens.length === 0 ? (
              <div className="empty p-4">
                <div className="empty-icon">
                  <i className={Icons.SEARCH}></i>
                </div>
                <p className="empty-title">No tokens found</p>
                <p className="empty-subtitle text-muted">Try adjusting your search query</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {filteredTokens.map(({ path, token, fileName }) => {
                  const resolved = resolveToken(token, allTokens);
                  const isCurrentValue = currentValue === `{${path}}`;

                  return (
                    <button
                      key={path}
                      className={`list-group-item list-group-item-action ${isCurrentValue ? "active" : ""}`}
                      onClick={() => handleSelect(path)}
                    >
                      <div className="d-flex align-items-center">
                        <Swatch token={token} resolvedValue={resolved.resolvedValue} />
                        <div className="flex-grow-1">
                          <div className="fw-bold">{path}</div>
                          {token.$description && <div className="text-muted small">{token.$description}</div>}
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <code className="small">{resolved.resolvedValue}</code>
                            {token.$type && <span className="badge bg-azure-lt">{token.$type}</span>}
                            <span className="badge bg-secondary-lt">{fileName}</span>
                          </div>
                        </div>
                        {isCurrentValue && <i className={Icons.CHECK + " ms-2"}></i>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card-footer text-muted">
          <small>
            <kbd>ESC</kbd> to close • {filteredTokens.length} token(s) found
          </small>
        </div>
      </div>

      <style>{`
        .alias-picker-overlay {
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

        .alias-picker-modal {
          width: 90%;
          max-width: 700px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .alias-picker-list {
          overflow-y: auto;
          max-height: 500px;
        }

        .alias-picker-list .list-group-item {
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .alias-picker-list .list-group-item:hover {
          background-color: rgba(66, 153, 225, 0.1);
        }

        .alias-picker-list .list-group-item.active {
          background-color: rgba(66, 153, 225, 0.2);
          border-color: #4299e1;
        }
      `}</style>
    </div>
  );
}
