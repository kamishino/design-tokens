import { useState, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import TokenEditor from "./components/TokenEditor";
import CommitBar from "./components/CommitBar";
import KitchenSink from "./components/KitchenSink";
import TokenTabs from "./components/TokenTabs";
import SearchBar from "./components/SearchBar";
import FigmaImport from "./components/FigmaImport";
import FilteredResultsView from "./components/FilteredResultsView";
import FindReplaceModal from "./components/FindReplaceModal";
import { Icons } from "./components/Icons";
import { TokenFile, TokenContent, DraftChanges } from "./types";
import {
  getTokenCategories,
  filterTokensByCategory,
  searchTokens,
  groupTokensByFile,
  getTokenCountsByCategory,
  getAllTokensFlattened,
  findTokenLocation,
} from "./utils/token-logic";

type View = "dashboard" | "kitchenSink";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [files, setFiles] = useState<TokenFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [tokenContent, setTokenContent] = useState<TokenContent | null>(null);
  const [allTokensContent, setAllTokensContent] = useState<
    Record<string, TokenContent>
  >({});
  const [draftChanges, setDraftChanges] = useState<DraftChanges>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFigmaImport, setShowFigmaImport] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);

  // Load file list on mount
  useEffect(() => {
    loadFiles();
    loadAllTokens();
  }, []);

  // Load selected file content
  useEffect(() => {
    if (selectedFile) {
      loadTokenFile(selectedFile);
    }
  }, [selectedFile]);

  const loadFiles = async () => {
    try {
      const response = await fetch("/api/files");
      const data = await response.json();
      setFiles(data.files);
    } catch (err) {
      setError("Failed to load token files");
      console.error(err);
    }
  };

  const loadTokenFile = async (filePath: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tokens?file=${encodeURIComponent(filePath)}`
      );
      const data = await response.json();
      setTokenContent(data.content);
      // Update allTokensContent with this file
      setAllTokensContent((prev) => ({ ...prev, [filePath]: data.content }));
    } catch (err) {
      setError("Failed to load token file");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTokens = async () => {
    try {
      const response = await fetch("/api/files");
      const data = await response.json();
      const allContent: Record<string, TokenContent> = {};

      // Load all token files for reference resolution
      for (const file of data.files) {
        try {
          const tokenResponse = await fetch(
            `/api/tokens?file=${encodeURIComponent(file.path)}`
          );
          const tokenData = await tokenResponse.json();
          allContent[file.path] = tokenData.content;
        } catch (err) {
          console.error(`Failed to load ${file.path}`, err);
        }
      }

      setAllTokensContent(allContent);
    } catch (err) {
      console.error("Failed to load all tokens", err);
    }
  };

  const updateTokenValue = (path: string[], newValue: any) => {
    if (!selectedFile || !tokenContent) return;

    // Update local state
    const updatedContent = { ...tokenContent };
    let current: any = updatedContent;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = newValue;

    setTokenContent(updatedContent);

    // Update global token cache for real-time resolution
    setAllTokensContent((prev) => ({
      ...prev,
      [selectedFile]: updatedContent,
    }));

    // Track in draft changes
    setDraftChanges((prev) => ({
      ...prev,
      [selectedFile]: updatedContent,
    }));
  };

  const commitChanges = async () => {
    setLoading(true);
    setError(null);

    try {
      // Save all modified files
      for (const [filePath, content] of Object.entries(draftChanges)) {
        await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: filePath, content }),
        });
      }

      // Trigger build
      await fetch("/api/build", { method: "POST" });

      // Clear draft changes
      setDraftChanges({});
      alert("Changes committed and build completed successfully!");
    } catch (err) {
      setError("Failed to commit changes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelChanges = () => {
    setDraftChanges({});
    if (selectedFile) {
      loadTokenFile(selectedFile);
    }
  };

  const hasDraftChanges = Object.keys(draftChanges).length > 0;

  // Get all categories from loaded tokens
  const categories = useMemo(() => {
    return getTokenCategories(allTokensContent);
  }, [allTokensContent]);

  // Filter tokens based on category and search query
  const filteredTokens = useMemo(() => {
    let tokens = getAllTokensFlattened(allTokensContent);

    // Apply category filter first
    if (activeCategory !== "all") {
      tokens = filterTokensByCategory(allTokensContent, activeCategory);
    }

    // Apply search filter second
    if (searchQuery.trim()) {
      const allTokensArray =
        activeCategory === "all"
          ? getAllTokensFlattened(allTokensContent)
          : tokens;
      tokens = searchTokens(allTokensContent, searchQuery).filter((token) =>
        allTokensArray.some(
          (t) => t.path === token.path && t.fileName === token.fileName
        )
      );
    }

    return tokens;
  }, [allTokensContent, activeCategory, searchQuery]);

  // Calculate token counts for category badges based on current search
  const tokenCounts = useMemo(() => {
    const tokensToCount = searchQuery.trim()
      ? searchTokens(allTokensContent, searchQuery)
      : getAllTokensFlattened(allTokensContent);
    return getTokenCountsByCategory(tokensToCount);
  }, [allTokensContent, searchQuery]);

  // Determine if filtering is active
  const isFiltering = activeCategory !== "all" || searchQuery.trim() !== "";

  // Group filtered tokens by file for display
  const groupedTokens = useMemo(() => {
    return groupTokensByFile(filteredTokens);
  }, [filteredTokens]);

  // Clear filters function
  const clearFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
  };

  // Handle file selection from sidebar
  const handleSelectFile = (filePath: string) => {
    setSelectedFile(filePath);
    // Auto-switch to dashboard view
    setView("dashboard");
    // Clear filters to show full file content
    clearFilters();
  };

  // Navigate to a token reference
  const handleNavigateToToken = (tokenPath: string) => {
    const location = findTokenLocation(tokenPath, allTokensContent);
    if (location) {
      setSelectedFile(location.fileName);
      // Clear filters to show the file
      setActiveCategory("all");
      setSearchQuery("");
    } else {
      alert(`Token "${tokenPath}" not found`);
    }
  };

  // Handle bulk find & replace
  const handleBulkReplace = (updatedTokens: Record<string, TokenContent>) => {
    // Update all tokens content and mark all as draft changes
    setAllTokensContent(updatedTokens);
    setDraftChanges(updatedTokens);

    // Reload current file if it was updated
    if (selectedFile && updatedTokens[selectedFile]) {
      setTokenContent(updatedTokens[selectedFile]);
    }
  };

  // Handle Figma import
  const handleFigmaImport = async (
    importedData: Record<string, TokenContent>
  ) => {
    // For now, just merge into the first file or create a new one
    // In a real implementation, you'd show a diff view and let user choose
    setDraftChanges((prev) => ({ ...prev, ...importedData }));
    await loadAllTokens();
  };

  return (
    <div className="page">
      <div className="page-wrapper">
        {/* Sidebar Navigation */}
        <Sidebar
          files={files}
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
          draftChanges={draftChanges}
          onViewChange={setView}
        />
        {/* Page Content */}
        <div className="page-body">
          <div className="container-xl">
            {/* Page Header */}
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <h2 className="page-title">
                    <i className={Icons.PALETTE + " me-2"}></i>
                    Token Management Dashboard
                  </h2>
                  <div className="text-muted">
                    Design Token Manager - CRUD Interface
                  </div>
                </div>
                <div className="col-auto ms-auto d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setShowFindReplace(true)}
                    title="Find and replace values globally"
                  >
                    <i className={Icons.SEARCH + " me-1"}></i>
                    Find & Replace
                  </button>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => setShowFigmaImport(true)}
                    title="Import from Figma Tokens Studio"
                  >
                    <i className={Icons.UPLOAD + " me-1"}></i>
                    Import from Figma
                  </button>
                  {hasDraftChanges && (
                    <span className="badge bg-green">
                      {Object.keys(draftChanges).length} file(s) modified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="page-body">
              {view === "kitchenSink" ? (
                <KitchenSink />
              ) : (
                <>
                  {/* Unified Filter Toolbar */}
                  <div className="content-toolbar">
                    {/* Category Tabs */}
                    <TokenTabs
                      categories={categories}
                      activeCategory={activeCategory}
                      onCategoryChange={setActiveCategory}
                      tokenCounts={tokenCounts}
                    />

                    {/* Search Bar */}
                    <SearchBar onSearch={setSearchQuery} showFilters={false} />
                  </div>

                  {error && (
                    <div
                      className="alert alert-danger alert-dismissible"
                      role="alert"
                    >
                      <div className="d-flex">
                        <div>
                          <i className={Icons.ALERT + " me-2"}></i>
                        </div>
                        <div>
                          <h4 className="alert-title">Error!</h4>
                          <div className="text-muted">{error}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div
                      className="d-flex justify-content-center align-items-center"
                      style={{ minHeight: "400px" }}
                    >
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}

                  {/* Filtered Results View */}
                  {isFiltering && !loading && (
                    <FilteredResultsView
                      groupedTokens={groupedTokens}
                      allTokens={allTokensContent}
                      onClearFilters={clearFilters}
                      activeCategory={activeCategory}
                      searchQuery={searchQuery}
                    />
                  )}

                  {/* Empty State - No File Selected */}
                  {!isFiltering && !selectedFile && !loading && (
                    <div className="empty">
                      <div className="empty-icon">
                        <i className={Icons.FILES}></i>
                      </div>
                      <p className="empty-title">
                        Select a token file to begin
                      </p>
                      <p className="empty-subtitle text-muted">
                        Choose a file from the sidebar to view and edit tokens
                      </p>
                    </div>
                  )}

                  {/* Token Editor - Single File View */}
                  {!isFiltering && selectedFile && tokenContent && !loading && (
                    <TokenEditor
                      filePath={selectedFile}
                      content={tokenContent}
                      onUpdate={updateTokenValue}
                      hasChanges={selectedFile in draftChanges}
                      allTokens={allTokensContent}
                      onNavigateToToken={handleNavigateToToken}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Commit Bar */}
        {hasDraftChanges && (
          <CommitBar
            changeCount={Object.keys(draftChanges).length}
            onCommit={commitChanges}
            onCancel={cancelChanges}
            disabled={loading}
          />
        )}
      </div>

      {/* Figma Import Modal */}
      {showFigmaImport && (
        <FigmaImport
          onImport={handleFigmaImport}
          onClose={() => setShowFigmaImport(false)}
          currentTokens={allTokensContent}
        />
      )}

      {/* Find & Replace Modal */}
      {showFindReplace && (
        <FindReplaceModal
          allTokens={allTokensContent}
          onReplace={handleBulkReplace}
          onClose={() => setShowFindReplace(false)}
        />
      )}
    </div>
  );
}
