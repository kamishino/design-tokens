/**
 * Autocomplete Component
 * Token reference autocomplete with fuzzy search
 */

import { useState, useEffect, useRef } from "react";
import { TokenContent } from "../types";
import { getAllTokensFlattened } from "../utils/token-logic";

interface AutocompleteProps {
  allTokens: Record<string, TokenContent>;
  onSelect: (tokenPath: string) => void;
  onClose: () => void;
  filterType?: string;
  position?: { top: number; left: number };
  searchQuery?: string;
}

export default function Autocomplete({ allTokens, onSelect, onClose, filterType, position, searchQuery = "" }: AutocompleteProps) {
  const [search, setSearch] = useState(searchQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get all available token paths
  const allPaths = getAllTokensFlattened(allTokens)
    .filter(({ token }) => {
      if (!filterType) return true;
      const tokenType = (token.$type || token.type || "").toLowerCase();
      return tokenType === filterType.toLowerCase();
    })
    .map(({ path }) => path);

  // Filter by search query
  const filteredPaths = allPaths.filter((path) => path.toLowerCase().includes(search.toLowerCase()));

  // Limit results
  const displayPaths = filteredPaths.slice(0, 50);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Reset selection when search changes
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, displayPaths.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (displayPaths[selectedIndex]) {
        onSelect(`{${displayPaths[selectedIndex]}}`);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <div
      className="autocomplete-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
      }}
      onClick={onClose}
    >
      <div
        className="card shadow-lg"
        style={{
          position: "absolute",
          top: position?.top || "50%",
          left: position?.left || "50%",
          transform: position ? "none" : "translate(-50%, -50%)",
          width: "500px",
          maxWidth: "90vw",
          zIndex: 1051,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h4 className="card-title mb-0">
            <i className="ti ti-search me-2"></i>
            Select Token Reference
          </h4>
          {filterType && <div className="text-muted small">Filtered to type: {filterType}</div>}
        </div>
        <div className="card-body p-0">
          <div className="p-3 border-bottom">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="text-muted small mt-1">
              {displayPaths.length} of {allPaths.length} tokens
              {filteredPaths.length > 50 && ` (showing first 50)`}
            </div>
          </div>
          <div
            ref={listRef}
            className="list-group list-group-flush"
            style={{
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {displayPaths.length === 0 ? (
              <div className="list-group-item text-muted text-center">No matching tokens found</div>
            ) : (
              displayPaths.map((path, index) => (
                <button
                  key={path}
                  className={`list-group-item list-group-item-action ${index === selectedIndex ? "active" : ""}`}
                  onClick={() => onSelect(`{${path}}`)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <code className={index === selectedIndex ? "text-white" : "text-primary"}>{path}</code>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="card-footer text-muted small">
          <i className="ti ti-info-circle me-1"></i>
          Use arrow keys to navigate, Enter to select, Esc to close
        </div>
      </div>
    </div>
  );
}
