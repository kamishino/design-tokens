/**
 * Token Dashboard Component
 * PRD 0065: Dashboard Integration & Feature Activation Pipeline
 * 
 * Integrates advanced token management features from PRD 0064 into a unified dashboard
 */

import { useMemo, useState } from 'react';
import TokenTabs from '../TokenTabs';
import TokenEditor from '../TokenEditor';
import FilteredResultsView from '../FilteredResultsView';
import TokenFilterBar from './TokenFilterBar';
import TokenPagination from './TokenPagination';
import TokenDetailModal from './TokenDetailModal';
import { useTokenCollection, type Token } from '../hooks/useTokenCollection';
import { exportTokensToCSV, exportTokensToJSON } from '../utils/exportUtils';
import { Icons } from '@shared/components/Icons';
import {
  getTokenCategories,
  getAllTokensFlattened,
  getTokenCountsByCategory,
  groupTokensByFile,
} from '@shared/utils/token-logic';
import type { TokenContent } from '@core/types';

interface TokenDashboardProps {
  // File selection
  selectedFile: string | null;
  tokenContent: TokenContent | null;
  allTokensContent: Record<string, TokenContent>;
  initialTokensContent: Record<string, TokenContent>;
  draftChanges: Record<string, TokenContent>;
  
  // Token operations
  onUpdate: (path: string[], newValue: any) => void;
  onRevertToken: (path: string[]) => void;
  onDeleteToken: (path: string[]) => void;
  onEditToken: (path: string[]) => void;
  onNavigateToToken: (tokenPath: string) => void;
  onAddToGroup: (path: string[], mode: 'group' | 'token') => void;
  
  // State
  loading: boolean;
  isSandboxMode: boolean;
}

export default function TokenDashboard({
  selectedFile,
  tokenContent,
  allTokensContent,
  initialTokensContent,
  draftChanges,
  onUpdate,
  onRevertToken,
  onDeleteToken,
  onEditToken,
  onNavigateToToken,
  onAddToGroup,
  loading,
  isSandboxMode,
}: TokenDashboardProps) {
  // Category and basic filtering state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailToken, setDetailToken] = useState<Token | null>(null);

  // Convert token content to Token format for the collection hook
  const allTokens = useMemo(() => {
    const flatTokens = getAllTokensFlattened(allTokensContent);
    return flatTokens.map((item): Token => {
      const tokenValue = item.token;
      const tokenType = (tokenValue && typeof tokenValue === 'object' && '$type' in tokenValue) 
        ? tokenValue.$type 
        : 'unknown';
      const tokenVal = (tokenValue && typeof tokenValue === 'object' && '$value' in tokenValue)
        ? tokenValue.$value
        : tokenValue;
      const tokenDesc = (tokenValue && typeof tokenValue === 'object' && '$description' in tokenValue)
        ? tokenValue.$description
        : undefined;
      
      return {
        id: `${item.fileName}-${item.path}`,
        path: item.path,
        name: item.path.split('.').pop() || item.path,
        type: tokenType || 'unknown',
        value: tokenVal,
        description: tokenDesc,
        brand: undefined,
        theme: undefined,
        status: 'active',
        created_at: undefined,
        updated_at: undefined,
      };
    });
  }, [allTokensContent]);

  // Initialize advanced token collection management
  const tokenCollection = useTokenCollection(allTokens);

  // Get categories and counts
  const categories = useMemo(() => {
    return getTokenCategories(allTokensContent);
  }, [allTokensContent]);

  const tokenCounts = useMemo(() => {
    const tokensToCount = tokenCollection.hasActiveFilters
      ? getAllTokensFlattened(allTokensContent).filter(item => {
          return tokenCollection.filteredTokens.some(t => t.path === item.path);
        })
      : getAllTokensFlattened(allTokensContent);
    return getTokenCountsByCategory(tokensToCount);
  }, [allTokensContent, tokenCollection.filteredTokens, tokenCollection.hasActiveFilters]);

  // Apply category filter on top of advanced filtering
  const displayTokens = useMemo(() => {
    if (activeCategory === 'all') {
      return tokenCollection.paginatedTokens;
    }
    
    // Filter by category
    return tokenCollection.paginatedTokens.filter(token => {
      const categoryMatches = activeCategory === 'all' || token.type === activeCategory;
      return categoryMatches;
    });
  }, [tokenCollection.paginatedTokens, activeCategory]);

  // Group tokens by file for display
  const groupedTokens = useMemo(() => {
    // Convert back to the expected format with token property
    const tokensForGrouping = getAllTokensFlattened(allTokensContent).filter(item => {
      return displayTokens.some(t => t.path === item.path);
    });
    return groupTokensByFile(tokensForGrouping);
  }, [displayTokens, allTokensContent]);

  // Determine if we're in filtering mode
  const isFiltering = tokenCollection.hasActiveFilters || activeCategory !== 'all';

  // Get unique types and themes from all tokens for filter dropdowns
  const availableTypes = useMemo(() => {
    const types = new Set(allTokens.map(t => t.type));
    return Array.from(types).filter(Boolean).sort();
  }, [allTokens]);

  // Handle export actions
  const handleExportCSV = () => {
    exportTokensToCSV(tokenCollection.filteredTokens, `tokens-${Date.now()}.csv`);
  };

  const handleExportJSON = () => {
    exportTokensToJSON(tokenCollection.filteredTokens, `tokens-${Date.now()}.json`);
  };

  // Clear all filters
  const clearAllFilters = () => {
    tokenCollection.clearFilters();
    setActiveCategory('all');
  };

  return (
    <div className="token-dashboard">
      {/* Unified Filter Toolbar */}
      <div className="content-toolbar mb-3">
        {/* Category Tabs */}
        <TokenTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          tokenCounts={tokenCounts}
        />

        {/* Advanced Filter Bar */}
        <div className="card mt-3">
          <div className="card-body">
            <TokenFilterBar
              searchQuery={tokenCollection.filters.searchQuery}
              onSearchChange={tokenCollection.setSearchQuery}
              selectedTypes={tokenCollection.filters.types}
              onTypeChange={tokenCollection.setTypeFilter}
              selectedThemes={tokenCollection.filters.themes}
              onThemeChange={tokenCollection.setThemeFilter}
              selectedStatuses={tokenCollection.filters.statuses}
              onStatusChange={tokenCollection.setStatusFilter}
              onClearFilters={clearAllFilters}
              hasActiveFilters={tokenCollection.hasActiveFilters || activeCategory !== 'all'}
              availableTypes={availableTypes}
            />
          </div>
        </div>

        {/* Export Actions */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            {tokenCollection.filteredCount > 0 ? (
              <>
                Showing {tokenCollection.filteredCount} of {tokenCollection.totalCount} tokens
                {tokenCollection.hasActiveFilters && ' (filtered)'}
              </>
            ) : (
              <>No tokens to display</>
            )}
          </div>
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-primary"
              onClick={handleExportCSV}
              disabled={tokenCollection.filteredCount === 0}
              title="Export filtered tokens as CSV"
            >
              <i className="bi bi-file-earmark-spreadsheet me-1"></i>
              Export CSV
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={handleExportJSON}
              disabled={tokenCollection.filteredCount === 0}
              title="Export filtered tokens as JSON"
            >
              <i className="bi bi-file-earmark-code me-1"></i>
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: '400px' }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          {/* Filtered Results View */}
          {isFiltering && (
            <div className="mb-3">
              <FilteredResultsView
                groupedTokens={groupedTokens}
                allTokens={allTokensContent}
                onClearFilters={clearAllFilters}
                activeCategory={activeCategory}
                searchQuery={tokenCollection.filters.searchQuery}
              />
            </div>
          )}

          {/* Empty State - No File Selected */}
          {!isFiltering && !selectedFile && (
            <div className="empty">
              <div className="empty-icon">
                <i className={Icons.FILES}></i>
              </div>
              <p className="empty-title">Select a token file to begin</p>
              <p className="empty-subtitle text-muted">
                Choose a file from the sidebar to view and edit tokens
              </p>
            </div>
          )}

          {/* Token Editor - Single File View */}
          {!isFiltering && selectedFile && tokenContent && (
            <TokenEditor
              filePath={selectedFile}
              content={tokenContent}
              onUpdate={onUpdate}
              hasChanges={draftChanges[selectedFile] !== undefined}
              allTokens={allTokensContent}
              onNavigateToToken={onNavigateToToken}
              baselineContent={initialTokensContent[selectedFile] || null}
              onRevertToken={onRevertToken}
              onDeleteToken={onDeleteToken}
              onAddToGroup={onAddToGroup}
              onEditToken={onEditToken}
              isSandboxMode={isSandboxMode}
            />
          )}

          {/* Pagination */}
          {tokenCollection.filteredCount > 0 && tokenCollection.totalPages > 1 && (
            <TokenPagination
              currentPage={tokenCollection.pagination.page}
              totalPages={tokenCollection.totalPages}
              itemsPerPage={tokenCollection.pagination.itemsPerPage}
              totalItems={tokenCollection.totalCount}
              displayedItems={tokenCollection.filteredCount}
              onPageChange={tokenCollection.setPage}
              onItemsPerPageChange={tokenCollection.setItemsPerPage}
            />
          )}
        </>
      )}

      {/* Token Detail Modal */}
      <TokenDetailModal
        token={detailToken}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={() => {
          if (detailToken) {
            const pathParts = detailToken.path.split('.');
            onEditToken(pathParts);
          }
        }}
      />

      <style>{`
        .token-dashboard {
          width: 100%;
        }
        
        .content-toolbar {
          position: relative;
        }
      `}</style>
    </div>
  );
}
