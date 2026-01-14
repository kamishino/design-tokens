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
import ExportModal from "./components/ExportModal";
import AddTokenModal from "./components/AddTokenModal";
import AppTopBar from "./components/AppTopBar";
import ProtectedRoute from "./components/ProtectedRoute";
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
  parseSlashPath,
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
  const [initialTokensContent, setInitialTokensContent] = useState<
    Record<string, TokenContent>
  >({});
  const [draftChanges, setDraftChanges] = useState<DraftChanges>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFigmaImport, setShowFigmaImport] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalMode, setAddModalMode] = useState<"file" | "group" | "token">(
    "token"
  );
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [addModalContext, setAddModalContext] = useState<{
    file?: string;
    path?: string;
  }>({});
  const [editTokenData, setEditTokenData] = useState<{
    name: string;
    type: string;
    value: any;
    description?: string;
  } | null>(null);

  // Sandbox & Multi-Project State
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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
      // Update baseline if not already set for this file
      setInitialTokensContent((prev) => {
        if (!prev[filePath]) {
          return {
            ...prev,
            [filePath]: JSON.parse(JSON.stringify(data.content)),
          };
        }
        return prev;
      });
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
      // Set baseline snapshot for change detection
      setInitialTokensContent(JSON.parse(JSON.stringify(allContent)));
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

      // Clear draft changes and reset baseline to new saved state
      setDraftChanges({});
      setInitialTokensContent(JSON.parse(JSON.stringify(allTokensContent)));
      alert("Changes committed and build completed successfully!");
    } catch (err) {
      setError("Failed to commit changes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const revertToken = (path: string[]) => {
    if (!selectedFile || !tokenContent) return;

    const initialContent = initialTokensContent[selectedFile];
    if (!initialContent) return;

    // Get the original value from baseline
    let baselineValue: any = initialContent;
    for (const key of path) {
      if (
        baselineValue &&
        typeof baselineValue === "object" &&
        key in baselineValue
      ) {
        baselineValue = baselineValue[key];
      } else {
        baselineValue = null;
        break;
      }
    }

    if (baselineValue !== null) {
      // Restore the original value
      const updatedContent = { ...tokenContent };
      let current: any = updatedContent;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = baselineValue;

      setTokenContent(updatedContent);
      setAllTokensContent((prev) => ({
        ...prev,
        [selectedFile]: updatedContent,
      }));

      // Re-check if file matches baseline after revert
      const hasActualChanges =
        JSON.stringify(updatedContent) !== JSON.stringify(initialContent);

      setDraftChanges((prev) => {
        const newDraftChanges = { ...prev };

        if (hasActualChanges) {
          newDraftChanges[selectedFile] = updatedContent;
        } else {
          delete newDraftChanges[selectedFile];
        }

        return newDraftChanges;
      });
    }
  };

  const deleteToken = (path: string[]) => {
    if (!selectedFile || !tokenContent) return;

    // Confirm deletion
    const tokenName = path.join(".");
    const confirmed = window.confirm(
      `Are you sure you want to delete token "${tokenName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    // Remove the token from the content
    const updatedContent = JSON.parse(JSON.stringify(tokenContent));
    let current: any = updatedContent;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    delete current[path[path.length - 1]];

    setTokenContent(updatedContent);
    setAllTokensContent((prev) => ({
      ...prev,
      [selectedFile]: updatedContent,
    }));

    // Check if file matches baseline after deletion
    const initialContent = initialTokensContent[selectedFile];
    if (initialContent) {
      const hasActualChanges =
        JSON.stringify(updatedContent) !== JSON.stringify(initialContent);

      setDraftChanges((prev) => {
        const newDraftChanges = { ...prev };

        if (hasActualChanges) {
          newDraftChanges[selectedFile] = updatedContent;
        } else {
          delete newDraftChanges[selectedFile];
        }

        return newDraftChanges;
      });
    } else {
      // No baseline, mark as modified
      setDraftChanges((prev) => ({
        ...prev,
        [selectedFile]: updatedContent,
      }));
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

  // Handle creating a new file/set
  const handleCreateFile = (
    category: "primitives" | "semantic" | "themes",
    filename: string
  ) => {
    const filePath = `tokens/${category}/${filename}.json`;
    const newContent: TokenContent = {};

    // Add to all tokens and draft changes
    setAllTokensContent((prev) => ({
      ...prev,
      [filePath]: newContent,
    }));

    setDraftChanges((prev) => ({
      ...prev,
      [filePath]: newContent,
    }));

    // Refresh file list and select the new file
    loadFiles().then(() => {
      setSelectedFile(filePath);
    });
  };

  // Handle creating a new group
  const handleCreateGroup = (
    filePath: string,
    path: string,
    groupName: string
  ) => {
    const content = allTokensContent[filePath];
    if (!content) return;

    const updatedContent = JSON.parse(JSON.stringify(content));
    const pathParts = path ? path.split(".") : [];
    let current = updatedContent;

    // Navigate to target location
    for (const part of pathParts) {
      if (!current[part]) current[part] = {};
      current = current[part];
    }

    // Add new group
    current[groupName] = {};

    // Update state
    setAllTokensContent((prev) => ({
      ...prev,
      [filePath]: updatedContent,
    }));

    setDraftChanges((prev) => ({
      ...prev,
      [filePath]: updatedContent,
    }));

    // If this is the selected file, update its content too
    if (filePath === selectedFile) {
      setTokenContent(updatedContent);
    }
  };

  // Handle creating a new token with support for slash-delimited nested paths
  const handleCreateToken = (
    filePath: string,
    path: string,
    tokenName: string,
    tokenData: { $type: string; $value: any; $description?: string }
  ) => {
    const content = allTokensContent[filePath];
    if (!content) return;

    const updatedContent = JSON.parse(JSON.stringify(content));
    const pathParts = path ? path.split(".") : [];
    let current = updatedContent;

    // Navigate to target location from context path
    for (const part of pathParts) {
      if (!current[part]) current[part] = {};
      current = current[part];
    }

    // Parse slash-delimited token name for auto-grouping
    // e.g., "button/primary/bg" -> ["button", "primary", "bg"]
    const tokenSegments = parseSlashPath(tokenName);

    // Navigate/create nested groups from slash path
    for (let i = 0; i < tokenSegments.length - 1; i++) {
      const segment = tokenSegments[i];
      if (!current[segment]) current[segment] = {};
      current = current[segment];
    }

    // Add new token at the final leaf node with W3C DTCG format
    const finalTokenName = tokenSegments[tokenSegments.length - 1];
    current[finalTokenName] = tokenData;

    // Update state
    setAllTokensContent((prev) => ({
      ...prev,
      [filePath]: updatedContent,
    }));

    setDraftChanges((prev) => ({
      ...prev,
      [filePath]: updatedContent,
    }));

    // If this is the selected file, update its content too
    if (filePath === selectedFile) {
      setTokenContent(updatedContent);
    }
  };

  // Open add modal with context
  const openAddModal = (
    mode: "file" | "group" | "token",
    file?: string,
    path?: string
  ) => {
    setAddModalMode(mode);
    setModalMode("create");
    setEditTokenData(null);
    setAddModalContext({ file, path });
    setShowAddModal(true);
  };

  // Handle edit token - open modal in edit mode
  const handleEditToken = (path: string[]) => {
    if (!selectedFile || !tokenContent) return;

    // Navigate to token value in content
    let current: any = tokenContent;
    for (const key of path) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        console.error("Token not found at path:", path);
        return;
      }
    }

    // Extract token data
    const tokenName = path[path.length - 1];
    const tokenType = current.$type || current.type || "string";
    const tokenValue = current.$value || current.value || "";
    const tokenDescription = current.$description || current.description || "";

    // Set edit mode state
    setModalMode("edit");
    setEditTokenData({
      name: tokenName,
      type: tokenType,
      value: tokenValue,
      description: tokenDescription,
    });
    setAddModalMode("token");
    setAddModalContext({
      file: selectedFile,
      path: path.slice(0, -1).join("."),
    });
    setShowAddModal(true);
  };

  // Handle update token from edit modal
  const handleUpdateToken = (
    filePath: string,
    path: string,
    tokenData: { $type: string; $value: any; $description?: string }
  ) => {
    const content = allTokensContent[filePath];
    if (!content) return;

    const updatedContent = JSON.parse(JSON.stringify(content));
    const pathParts = path ? path.split(".") : [];
    let current = updatedContent;

    // Navigate to target location
    for (const part of pathParts) {
      if (!current[part]) return; // Path doesn't exist
      current = current[part];
    }

    // Get the token name from editTokenData
    if (!editTokenData) return;
    const tokenName = editTokenData.name;

    // Update the token at this location
    if (current[tokenName]) {
      current[tokenName] = tokenData;
    }

    // Update state
    setAllTokensContent((prev) => ({
      ...prev,
      [filePath]: updatedContent,
    }));

    setDraftChanges((prev) => ({
      ...prev,
      [filePath]: updatedContent,
    }));

    // If this is the selected file, update its content too
    if (filePath === selectedFile) {
      setTokenContent(updatedContent);
    }
  };

  // Handle publish to production
  const handlePublish = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual publish workflow
      // 1. Fetch drafts from Supabase
      // 2. Merge into local JSON files
      // 3. Clear Supabase drafts
      // 4. Reload tokens
      console.log("Publishing to production...");
      alert(
        "Publish workflow not yet implemented. This will merge Supabase drafts into local JSON files."
      );
    } catch (err) {
      console.error("Publish error:", err);
      setError("Failed to publish changes");
    } finally {
      setLoading(false);
    }
  };

  // Handle project change
  const handleProjectChange = (projectId: string) => {
    setActiveProjectId(projectId);
    // TODO: Reload tokens for the new project
    console.log("Switching to project:", projectId);
  };

  return (
    <ProtectedRoute>
      <div className="page">
        {/* Global Top Bar - System Level Controls */}
        <AppTopBar
          isSandboxMode={isSandboxMode}
          onToggleSandbox={setIsSandboxMode}
          hasDraftChanges={hasDraftChanges}
          draftChangeCount={Object.keys(draftChanges).length}
          activeProjectId={activeProjectId}
          onProjectChange={handleProjectChange}
          onPublish={handlePublish}
        />

        <div className="page-wrapper">
          {/* Sidebar Navigation */}
          <Sidebar
            files={files}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
            draftChanges={draftChanges}
            onViewChange={setView}
            onAddFile={() => openAddModal("file")}
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
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setShowExportModal(true)}
                      title="Export tokens as JSON"
                    >
                      <i className={Icons.DOWNLOAD + " me-1"}></i>
                      Export
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => openAddModal("token")}
                      title="Add new token"
                    >
                      <i className={Icons.ADD + " me-1"}></i>
                      Add Token
                    </button>
                    {hasDraftChanges && (
                      <span className="badge bg-green-lt">
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
                      <SearchBar
                        onSearch={setSearchQuery}
                        showFilters={false}
                      />
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
                    {!isFiltering &&
                      selectedFile &&
                      tokenContent &&
                      !loading && (
                        <TokenEditor
                          filePath={selectedFile}
                          content={tokenContent}
                          onUpdate={updateTokenValue}
                          hasChanges={draftChanges[selectedFile] !== undefined}
                          allTokens={allTokensContent}
                          onNavigateToToken={handleNavigateToToken}
                          baselineContent={
                            initialTokensContent[selectedFile] || null
                          }
                          onRevertToken={revertToken}
                          onDeleteToken={deleteToken}
                          onAddToGroup={(path, mode) =>
                            openAddModal(mode, selectedFile, path.join("."))
                          }
                          onEditToken={handleEditToken}
                          isSandboxMode={isSandboxMode}
                        />
                      )}
                  </>
                )}

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

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          selectedFile={selectedFile}
          selectedFileContent={tokenContent}
          allTokensContent={allTokensContent}
        />

        {/* Add/Edit Token Modal */}
        <AddTokenModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          mode={addModalMode}
          modalMode={modalMode}
          initialData={editTokenData || undefined}
          targetFile={addModalContext.file || selectedFile}
          targetPath={addModalContext.path || ""}
          allTokensContent={allTokensContent}
          onCreateFile={handleCreateFile}
          onCreateGroup={handleCreateGroup}
          onCreateToken={handleCreateToken}
          onUpdateToken={handleUpdateToken}
        />
        </div>
      </div>
    </ProtectedRoute>
  );
}
