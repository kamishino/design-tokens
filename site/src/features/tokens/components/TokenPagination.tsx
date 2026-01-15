/**
 * Token Pagination Component
 * PRD 0064: Advanced Token Management System
 * 
 * Provides pagination controls and items-per-page selector
 */

import { useMemo } from 'react';

interface TokenPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  displayedItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function TokenPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  displayedItems,
  onPageChange,
  onItemsPerPageChange,
}: TokenPaginationProps) {
  // Calculate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and nearby pages with ellipsis
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="token-pagination">
      <div className="row align-items-center">
        {/* Items per page selector */}
        <div className="col-md-3">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 text-nowrap">Items per page:</label>
            <select
              className="form-select form-select-sm"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              style={{ width: 'auto' }}
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info text */}
        <div className="col-md-6 text-center">
          <span className="text-muted">
            Showing {startItem} to {endItem} of {displayedItems} 
            {displayedItems < totalItems && ` (filtered from ${totalItems})`}
          </span>
        </div>

        {/* Page navigation */}
        <div className="col-md-3">
          <nav aria-label="Token pagination">
            <ul className="pagination pagination-sm justify-content-end mb-0">
              {/* Previous button */}
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous"
                >
                  <span aria-hidden="true">&laquo;</span>
                </button>
              </li>

              {/* Page numbers */}
              {pageNumbers.map((page, index) => {
                if (page === '...') {
                  return (
                    <li key={`ellipsis-${index}`} className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  );
                }

                return (
                  <li
                    key={page}
                    className={`page-item ${currentPage === page ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => onPageChange(page as number)}
                    >
                      {page}
                    </button>
                  </li>
                );
              })}

              {/* Next button */}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next"
                >
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <style>{`
        .token-pagination {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #dee2e6;
        }
        
        .token-pagination .page-link {
          cursor: pointer;
        }
        
        .token-pagination .page-item.disabled .page-link {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
