import { TokenFile, DraftChanges } from "../types";

interface SidebarProps {
  files: TokenFile[];
  selectedFile: string | null;
  onSelectFile: (file: string) => void;
  draftChanges: DraftChanges;
}

export default function Sidebar({ files, selectedFile, onSelectFile, draftChanges }: SidebarProps) {
  // Group files by category
  const filesByCategory = files.reduce((acc, file) => {
    const category = file.category || "root";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file);
    return acc;
  }, {} as Record<string, TokenFile[]>);

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Token Files</h2>

      <nav className="sidebar-nav">
        {Object.entries(filesByCategory).map(([category, categoryFiles]) => (
          <div key={category} className="sidebar-category">
            <h3 className="category-title">{category}</h3>
            <ul className="file-list">
              {categoryFiles.map((file) => {
                const isSelected = selectedFile === file.path;
                const hasChanges = file.path in draftChanges;

                return (
                  <li key={file.path}>
                    <button className={`file-button ${isSelected ? "selected" : ""}`} onClick={() => onSelectFile(file.path)}>
                      <span className="file-name">
                        {hasChanges && <span className="change-indicator">●</span>}
                        {file.name}
                      </span>
                      <span className="file-size">{formatBytes(file.size)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
