/**
 * Advanced Token Collection Hook
 * PRD 0064: Advanced Token Management System
 * 
 * Provides comprehensive state management for token collections including:
 * - Fuzzy search
 * - Multi-condition filtering
 * - Client-side pagination
 * - Sorting
 */

import { useMemo, useState, useCallback } from 'react';

export interface Token {
  id: string;
  path: string;
  name: string;
  type: string;
  value: any;
  description?: string;
  brand?: string;
  theme?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterOptions {
  searchQuery: string;
  types: string[];
  themes: string[];
  statuses: string[];
}

export interface PaginationOptions {
  page: number;
  itemsPerPage: number;
}

export interface SortOptions {
  field: 'name' | 'type' | 'updated_at' | 'path';
  direction: 'asc' | 'desc';
}

export interface UseTokenCollectionResult {
  // Data
  tokens: Token[];
  filteredTokens: Token[];
  paginatedTokens: Token[];
  totalCount: number;
  filteredCount: number;
  
  // Filter state
  filters: FilterOptions;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (types: string[]) => void;
  setThemeFilter: (themes: string[]) => void;
  setStatusFilter: (statuses: string[]) => void;
  clearFilters: () => void;
  
  // Pagination state
  pagination: PaginationOptions;
  setPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  totalPages: number;
  
  // Sort state
  sort: SortOptions;
  setSort: (field: SortOptions['field'], direction?: SortOptions['direction']) => void;
  
  // Utilities
  hasActiveFilters: boolean;
}

const defaultFilters: FilterOptions = {
  searchQuery: '',
  types: [],
  themes: [],
  statuses: [],
};

const defaultPagination: PaginationOptions = {
  page: 1,
  itemsPerPage: 20,
};

const defaultSort: SortOptions = {
  field: 'name',
  direction: 'asc',
};

/**
 * Fuzzy search implementation
 */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Exact match
  if (lowerText.includes(lowerQuery)) return true;
  
  // Fuzzy match: all characters in query appear in order in text
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === lowerQuery.length;
}

/**
 * Main hook for token collection management
 */
export function useTokenCollection(tokens: Token[]): UseTokenCollectionResult {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [pagination, setPagination] = useState<PaginationOptions>(defaultPagination);
  const [sort, setSort] = useState<SortOptions>(defaultSort);

  // Filter tokens
  const filteredTokens = useMemo(() => {
    let result = [...tokens];

    // Search filter
    if (filters.searchQuery) {
      result = result.filter((token) => {
        const searchableText = `${token.path} ${token.name} ${token.description || ''}`;
        return fuzzyMatch(searchableText, filters.searchQuery);
      });
    }

    // Type filter
    if (filters.types.length > 0) {
      result = result.filter((token) => filters.types.includes(token.type));
    }

    // Theme filter
    if (filters.themes.length > 0) {
      result = result.filter((token) => 
        token.theme && filters.themes.includes(token.theme)
      );
    }

    // Status filter
    if (filters.statuses.length > 0) {
      result = result.filter((token) => 
        token.status && filters.statuses.includes(token.status)
      );
    }

    return result;
  }, [tokens, filters]);

  // Sort tokens
  const sortedTokens = useMemo(() => {
    const result = [...filteredTokens];

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'path':
          aValue = a.path.toLowerCase();
          bValue = b.path.toLowerCase();
          break;
        case 'updated_at':
          aValue = a.updated_at || '';
          bValue = b.updated_at || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filteredTokens, sort]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedTokens.length / pagination.itemsPerPage);
  
  // Paginate tokens
  const paginatedTokens = useMemo(() => {
    const start = (pagination.page - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return sortedTokens.slice(start, end);
  }, [sortedTokens, pagination]);

  // Filter setters
  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const setTypeFilter = useCallback((types: string[]) => {
    setFilters((prev) => ({ ...prev, types }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const setThemeFilter = useCallback((themes: string[]) => {
    setFilters((prev) => ({ ...prev, themes }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const setStatusFilter = useCallback((statuses: string[]) => {
    setFilters((prev) => ({ ...prev, statuses }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Pagination setters
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page: Math.max(1, Math.min(page, totalPages)) }));
  }, [totalPages]);

  const setItemsPerPage = useCallback((itemsPerPage: number) => {
    setPagination({ page: 1, itemsPerPage });
  }, []);

  // Sort setter
  const setSortFunction = useCallback((field: SortOptions['field'], direction?: SortOptions['direction']) => {
    setSort((prev) => ({
      field,
      direction: direction || (prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'),
    }));
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== '' ||
      filters.types.length > 0 ||
      filters.themes.length > 0 ||
      filters.statuses.length > 0
    );
  }, [filters]);

  return {
    tokens,
    filteredTokens: sortedTokens,
    paginatedTokens,
    totalCount: tokens.length,
    filteredCount: sortedTokens.length,
    
    filters,
    setSearchQuery,
    setTypeFilter,
    setThemeFilter,
    setStatusFilter,
    clearFilters,
    
    pagination,
    setPage,
    setItemsPerPage,
    totalPages,
    
    sort,
    setSort: setSortFunction,
    
    hasActiveFilters,
  };
}
