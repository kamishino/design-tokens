import { Icons } from "./Icons";
import { TokenValue, TokenContent } from "../types";
import { resolveToken } from "../utils/token-logic";
import Swatch from "./Swatch";
import InlineValue from "./InlineValue";

interface FilteredResultsViewProps {
  groupedTokens: Record<string, Array<{ path: string; token: TokenValue }>>;
  allTokens: Record<string, TokenContent>;
  onClearFilters: () => void;
  activeCategory: string;
  searchQuery: string;
}

export default function FilteredResultsView({
  groupedTokens,
  allTokens,
  onClearFilters,
  activeCategory,
  searchQuery,
}: FilteredResultsViewProps) {
  const fileCount = Object.keys(groupedTokens).length;
  const tokenCount = Object.values(groupedTokens).reduce(
    (sum, tokens) => sum + tokens.length,
    0
  );

  if (tokenCount === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">
          <i className={Icons.SEARCH}></i>
        </div>
        <p className="empty-title">No tokens found</p>
        <p className="empty-subtitle text-muted">
          {searchQuery
            ? `No results for "${searchQuery}"`
            : `No tokens in category "${activeCategory}"`}
        </p>
        <div className="empty-action">
          <button className="btn btn-primary" onClick={onClearFilters}>
            <i className={Icons.CLOSE + " me-1"}></i>
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className={Icons.FILTER + " me-2"}></i>
          Filtered Results
        </h3>
        <div className="card-actions d-flex align-items-center">
          <span className="badge bg-blue-lt me-2">
            {tokenCount} token{tokenCount !== 1 ? "s" : ""} in {fileCount} file
            {fileCount !== 1 ? "s" : ""}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClearFilters}
          >
            <i className={Icons.CLOSE + " me-1"}></i>
            Clear Filters
          </button>
        </div>
      </div>
      <div className="card-body">
        {Object.entries(groupedTokens).map(([fileName, tokens]) => (
          <div key={fileName} className="mb-4">
            <div className="d-flex align-items-center mb-2">
              <i className={Icons.FILE_CODE + " me-2 text-muted"}></i>
              <h4 className="mb-0">{fileName}</h4>
              <span className="badge bg-secondary-lt ms-2">
                {tokens.length}
              </span>
            </div>
            <div className="list-group list-group-flush">
              {tokens.map(({ path, token }) => {
                const resolved = resolveToken(token, allTokens);
                const tokenType = token.$type || token.type || "other";
                const value = token.$value || token.value;
                const description = token.$description || token.description;

                return (
                  <div key={path} className="list-group-item">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <Swatch
                          token={token}
                          resolvedValue={resolved.resolvedValue}
                        />
                      </div>
                      <div className="col">
                        <div className="d-flex align-items-center">
                          <strong className="font-monospace">{path}</strong>
                          <span className="badge bg-primary-lt ms-2">
                            {tokenType}
                          </span>
                          {!resolved.isValid && (
                            <span
                              className="badge bg-danger ms-2"
                              title={resolved.error}
                            >
                              <i className={Icons.ALERT}></i> Broken Reference
                            </span>
                          )}
                        </div>
                        <div className="text-muted small mt-1">
                          {resolved.isReference ? (
                            <>
                              <span className="badge bg-purple-lt me-1">
                                {value}
                              </span>
                              <i className={Icons.CHEVRON_RIGHT + " mx-1"}></i>
                              <InlineValue
                                value={resolved.resolvedValue}
                                type={tokenType}
                              />
                            </>
                          ) : (
                            <InlineValue value={value} type={tokenType} />
                          )}
                        </div>
                        {description && (
                          <div className="text-muted small mt-1">
                            {description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
