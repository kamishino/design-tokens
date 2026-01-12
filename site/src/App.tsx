import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TokenEditor from "./components/TokenEditor";
import CommitBar from "./components/CommitBar";
import { TokenFile, TokenContent, DraftChanges } from "./types";

export default function App() {
  const [files, setFiles] = useState<TokenFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [tokenContent, setTokenContent] = useState<TokenContent | null>(null);
  const [draftChanges, setDraftChanges] = useState<DraftChanges>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load file list on mount
  useEffect(() => {
    loadFiles();
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
      const response = await fetch(`/api/tokens?file=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      setTokenContent(data.content);
    } catch (err) {
      setError("Failed to load token file");
      console.error(err);
    } finally {
      setLoading(false);
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Token Management Dashboard</h1>
        <p>Design Token Manager - CRUD Interface</p>
      </header>

      <div className="app-layout">
        <Sidebar files={files} selectedFile={selectedFile} onSelectFile={setSelectedFile} draftChanges={draftChanges} />

        <main className="app-main">
          {error && <div className="error-banner">⚠️ {error}</div>}

          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner">Loading...</div>
            </div>
          )}

          {!selectedFile && !loading && (
            <div className="empty-state">
              <h2>Select a token file to begin</h2>
              <p>Choose a file from the sidebar to view and edit tokens</p>
            </div>
          )}

          {selectedFile && tokenContent && !loading && (
            <TokenEditor filePath={selectedFile} content={tokenContent} onUpdate={updateTokenValue} hasChanges={selectedFile in draftChanges} />
          )}
        </main>
      </div>

      {hasDraftChanges && (
        <CommitBar changeCount={Object.keys(draftChanges).length} onCommit={commitChanges} onCancel={cancelChanges} disabled={loading} />
      )}
    </div>
  );
}
