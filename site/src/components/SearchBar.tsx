/**
 * SearchBar Component
 * Global search for tokens with filtering capabilities
 */

import { useState } from "react";
import { Icons } from "./Icons";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  showFilters?: boolean;
  onFilterBrokenRefs?: () => void;
  onFilterMissingDesc?: () => void;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search tokens by name, value, or description...",
  showFilters = false,
  onFilterBrokenRefs,
  onFilterMissingDesc,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="mb-3">
      <div className="input-group">
        <span className="input-group-text">
          <i className={Icons.SEARCH}></i>
        </span>
        <input type="text" className="form-control" placeholder={placeholder} value={query} onChange={handleChange} />
        {query && (
          <button className="btn btn-outline-secondary" type="button" onClick={handleClear} title="Clear search">
            <i className={Icons.CLOSE}></i>
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-2 d-flex gap-2">
          {onFilterBrokenRefs && (
            <button className="btn btn-sm btn-outline-danger" onClick={onFilterBrokenRefs} title="Show only tokens with broken references">
              <i className={Icons.ERROR + " me-1"}></i>
              Broken References
            </button>
          )}
          {onFilterMissingDesc && (
            <button className="btn btn-sm btn-outline-warning" onClick={onFilterMissingDesc} title="Show only tokens without descriptions">
              <i className={Icons.WARNING + " me-1"}></i>
              Missing Descriptions
            </button>
          )}
        </div>
      )}
    </div>
  );
}
