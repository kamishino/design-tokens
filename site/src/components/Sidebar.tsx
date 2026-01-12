import { TokenFile, DraftChanges } from "../types";
import { Icons } from "./Icons";

interface SidebarProps {
  files: TokenFile[];
  selectedFile: string | null;
  onSelectFile: (file: string) => void;
  draftChanges: DraftChanges;
  onViewChange?: (view: "dashboard" | "kitchenSink") => void;
}

// Icon mapping for different token categories
const categoryIcons: Record<string, string> = {
  primitives: "ti ti-palette",
  semantic: "ti ti-layers-linked",
  themes: "ti ti-moon",
  generated: "ti ti-file-code",
  root: "ti ti-files",
};

export default function Sidebar({ files, selectedFile, onSelectFile, draftChanges, onViewChange }: SidebarProps) {
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
    <aside className="navbar navbar-vertical navbar-expand-lg">
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar-menu">
          <span className="navbar-toggler-icon"></span>
        </button>

        <h1 className="navbar-brand navbar-brand-autodark">
          <a href=".">
            <i className={Icons.BRAND + " me-2"}></i>
            Token Manager
          </a>
        </h1>

        <div className="collapse navbar-collapse" id="sidebar-menu">
          <ul className="navbar-nav pt-lg-3">
            {onViewChange && (
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onViewChange("kitchenSink");
                  }}
                >
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <i className={Icons.PALETTE}></i>
                  </span>
                  <span className="nav-link-title">UI Kitchen Sink</span>
                </a>
              </li>
            )}
            {Object.entries(filesByCategory).map(([category, categoryFiles]) => (
              <li key={category} className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#navbar-base" data-bs-toggle="dropdown" role="button" aria-expanded="false">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <i className={categoryIcons[category] || "ti-files"}></i>
                  </span>
                  <span className="nav-link-title text-capitalize">{category}</span>
                </a>
                <div className="dropdown-menu">
                  <div className="dropdown-menu-columns">
                    <div className="dropdown-menu-column">
                      {categoryFiles.map((file) => {
                        const isSelected = selectedFile === file.path;
                        const hasChanges = file.path in draftChanges;

                        return (
                          <a
                            key={file.path}
                            className={`dropdown-item ${isSelected ? "active" : ""}`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onSelectFile(file.path);
                            }}
                          >
                            <span className="d-flex align-items-center justify-content-between">
                              <span>
                                {hasChanges && <span className="status-dot status-dot-animated bg-green me-2"></span>}
                                {file.name}
                              </span>
                              <span className="text-muted small">{formatBytes(file.size)}</span>
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
