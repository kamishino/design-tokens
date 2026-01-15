/**
 * Token Filter Bar Component
 * PRD 0064: Advanced Token Management System
 * 
 * Provides search and multi-condition filtering interface
 */

import { useState, useCallback, useEffect } from 'react';
import { Icons } from '@shared/components/Icons';

interface TokenFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  selectedThemes: string[];
  onThemeChange: (themes: string[]) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  availableTypes?: string[];
  availableThemes?: string[];
  availableStatuses?: string[];
}

export default function TokenFilterBar({
  searchQuery,
  onSearchChange,
  selectedTypes,
  onTypeChange,
  selectedThemes,
  onThemeChange,
  selectedStatuses,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  availableTypes = ['color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number'],
  availableThemes = ['light', 'dark'],
  availableStatuses = ['active', 'deprecated', 'experimental'],
}: TokenFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sync external changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleTypeToggle = useCallback((type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onTypeChange(newTypes);
  }, [selectedTypes, onTypeChange]);

  const handleThemeToggle = useCallback((theme: string) => {
    const newThemes = selectedThemes.includes(theme)
      ? selectedThemes.filter((t) => t !== theme)
      : [...selectedThemes, theme];
    onThemeChange(newThemes);
  }, [selectedThemes, onThemeChange]);

  const handleStatusToggle = useCallback((status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    onStatusChange(newStatuses);
  }, [selectedStatuses, onStatusChange]);

  return (
    <div className="token-filter-bar">
      <div className="row g-2 align-items-center">
        {/* Search Input */}
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <i className={Icons.SEARCH}></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search tokens (fuzzy match)..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setLocalSearch('')}
                title="Clear search"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>

        {/* Type Filter Dropdown */}
        <div className="col-md-2">
          <div className="dropdown">
            <button
              className={`btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center ${selectedTypes.length > 0 ? 'active' : ''}`}
              type="button"
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <span>
                Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}
              </span>
              <i className={`bi bi-chevron-${showTypeDropdown ? 'up' : 'down'}`}></i>
            </button>
            {showTypeDropdown && (
              <div className="dropdown-menu show w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {availableTypes.map((type) => (
                  <div key={type} className="dropdown-item">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeToggle(type)}
                      />
                      <label className="form-check-label" htmlFor={`type-${type}`}>
                        {type}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Theme Filter Dropdown */}
        <div className="col-md-2">
          <div className="dropdown">
            <button
              className={`btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center ${selectedThemes.length > 0 ? 'active' : ''}`}
              type="button"
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            >
              <span>
                Theme {selectedThemes.length > 0 && `(${selectedThemes.length})`}
              </span>
              <i className={`bi bi-chevron-${showThemeDropdown ? 'up' : 'down'}`}></i>
            </button>
            {showThemeDropdown && (
              <div className="dropdown-menu show w-100">
                {availableThemes.map((theme) => (
                  <div key={theme} className="dropdown-item">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`theme-${theme}`}
                        checked={selectedThemes.includes(theme)}
                        onChange={() => handleThemeToggle(theme)}
                      />
                      <label className="form-check-label" htmlFor={`theme-${theme}`}>
                        {theme}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Filter Dropdown */}
        <div className="col-md-2">
          <div className="dropdown">
            <button
              className={`btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center ${selectedStatuses.length > 0 ? 'active' : ''}`}
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <span>
                Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
              </span>
              <i className={`bi bi-chevron-${showStatusDropdown ? 'up' : 'down'}`}></i>
            </button>
            {showStatusDropdown && (
              <div className="dropdown-menu show w-100">
                {availableStatuses.map((status) => (
                  <div key={status} className="dropdown-item">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`status-${status}`}
                        checked={selectedStatuses.includes(status)}
                        onChange={() => handleStatusToggle(status)}
                      />
                      <label className="form-check-label" htmlFor={`status-${status}`}>
                        {status}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="col-md-2">
          <button
            className="btn btn-outline-danger w-100"
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            title="Clear all filters"
          >
            <i className="bi bi-x-circle me-1"></i>
            Clear Filters
          </button>
        </div>
      </div>

      <style>{`
        .token-filter-bar {
          margin-bottom: 1rem;
        }
        
        .token-filter-bar .btn.active {
          background-color: #0d6efd;
          color: white;
          border-color: #0d6efd;
        }
        
        .token-filter-bar .dropdown-menu {
          display: block;
          position: absolute;
          z-index: 1000;
        }
        
        .token-filter-bar .dropdown-item {
          cursor: pointer;
        }
        
        .token-filter-bar .form-check-label {
          cursor: pointer;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
