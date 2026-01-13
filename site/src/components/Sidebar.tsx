import { useState } from "react";
import { TokenFile, DraftChanges } from "../types";
import { Icons } from "./Icons";

interface SidebarProps {
  files: TokenFile[];
  selectedFile: string | null;
  onSelectFile: (file: string) => void;
  draftChanges: DraftChanges;
  onViewChange?: (view: "dashboard" | "kitchenSink") => void;
  onAddFile?: () => void;
}

export default function Sidebar({
  files,
  selectedFile,
  onSelectFile,
  draftChanges,
  onViewChange,
  onAddFile,
}: SidebarProps) {
  // State for expanded categories (persistent across file selections)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["primitives", "semantic"])
  );

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

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
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#sidebar-menu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <h1 className="navbar-brand navbar-brand-autodark">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onViewChange) {
                onViewChange("dashboard");
              }
            }}
          >
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

            {/* Add New Set Button */}
            {onAddFile && (
              <li className="nav-item">
                <a
                  className="nav-link text-primary"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onAddFile();
                  }}
                  style={{ fontWeight: 600 }}
                >
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <i className={Icons.ADD}></i>
                  </span>
                  <span className="nav-link-title">Add New Set</span>
                </a>
              </li>
            )}

            {Object.entries(filesByCategory).map(
              ([category, categoryFiles]) => {
                const isExpanded = expandedCategories.has(category);

                return (
                  <li key={category} className="nav-item">
                    {/* Category Header */}
                    <a
                      className="nav-link py-2"
                      href="#"
                      role="button"
                      aria-expanded={isExpanded}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleCategory(category);
                      }}
                      style={{ fontWeight: 600, fontSize: "0.875rem" }}
                    >
                      <span className="nav-link-icon d-md-none d-lg-inline-block">
                        <i
                          className={
                            isExpanded ? "ti ti-folder-open" : "ti ti-folder"
                          }
                        ></i>
                      </span>
                      <span className="nav-link-title text-capitalize text-muted">
                        {category}
                      </span>
                    </a>
                    {/* Inline File List (Tree View) */}
                    {isExpanded && (
                      <ul className="nav flex-column sidebar-indent-level-1 tree-container">
                        {categoryFiles.map((file, index) => {
                          const isSelected = selectedFile === file.path;
                          const hasChanges = file.path in draftChanges;
                          const isLastChild =
                            index === categoryFiles.length - 1;

                          return (
                            <li
                              key={file.path}
                              className={`nav-item tree-item ${
                                isLastChild ? "last-child" : ""
                              } ${isSelected ? "active-path" : ""}`}
                            >
                              <a
                                className={`nav-link py-1 ${
                                  isSelected ? "text-primary fw-bold" : ""
                                }`}
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onSelectFile(file.path);
                                }}
                                style={{
                                  fontSize: "0.875rem",
                                  paddingLeft: "0.5rem",
                                }}
                              >
                                <span className="d-flex align-items-center justify-content-between">
                                  <span className="d-flex align-items-center">
                                    {hasChanges && (
                                      <span
                                        className="badge bg-green-lt text-green me-2"
                                        style={{
                                          fontSize: "0.65rem",
                                          padding: "0.125rem 0.35rem",
                                        }}
                                      >
                                        Modified
                                      </span>
                                    )}
                                    {file.name}
                                  </span>
                                  <span
                                    className="text-muted"
                                    style={{ fontSize: "0.7rem" }}
                                  >
                                    {formatBytes(file.size)}
                                  </span>
                                </span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }
            )}
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
