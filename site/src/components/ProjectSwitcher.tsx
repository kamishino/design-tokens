import { useState, useEffect } from "react";
import { Icons } from "./Icons";
import { Project, fetchProjects, isSupabaseEnabled } from "../lib/supabase";

interface ProjectSwitcherProps {
  activeProjectId: string | null;
  onProjectChange: (projectId: string) => void;
}

export default function ProjectSwitcher({
  activeProjectId,
  onProjectChange,
}: ProjectSwitcherProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Don't render if Supabase is not configured
  if (!isSupabaseEnabled()) {
    return null;
  }

  // Fetch projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await fetchProjects();
    setProjects(data);
    setLoading(false);
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2"
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
      >
        <i className={Icons.FOLDER}></i>
        <span>
          {loading
            ? "Loading..."
            : activeProject
            ? activeProject.name
            : "Select Project"}
        </span>
      </button>

      {showDropdown && (
        <div
          className="dropdown-menu show"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          <div className="dropdown-header">
            <div className="d-flex justify-content-between align-items-center">
              <span>Projects</span>
              <button
                className="btn btn-sm btn-ghost-secondary"
                onClick={() => {
                  loadProjects();
                }}
                title="Refresh projects"
              >
                <i className={Icons.REFRESH}></i>
              </button>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          {projects.length === 0 && !loading && (
            <div className="dropdown-item-text text-muted small">
              No projects found. Create one in Supabase.
            </div>
          )}

          {projects.map((project) => (
            <button
              key={project.id}
              className={`dropdown-item ${
                project.id === activeProjectId ? "active" : ""
              }`}
              onClick={() => {
                onProjectChange(project.id);
                setShowDropdown(false);
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-bold">{project.name}</div>
                  {project.git_url && (
                    <div className="small text-muted">{project.git_url}</div>
                  )}
                </div>
                {project.id === activeProjectId && (
                  <i className={Icons.CHECK}></i>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
