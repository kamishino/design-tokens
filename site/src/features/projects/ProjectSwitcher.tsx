import { useState, useEffect } from "react";
import { Icons } from "@shared/components/Icons";
import { Project, fetchProjects, isSupabaseEnabled } from "@core/lib/supabase";
import AddProjectModal from "./AddProjectModal";
import AddBrandModal from "./AddBrandModal";

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
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandModalContext, setBrandModalContext] = useState<{
    projectId: string;
    projectName: string;
  } | null>(null);

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

  const handleProjectCreated = (projectId: string) => {
    loadProjects();
    onProjectChange(projectId);
    setShowDropdown(false);
  };

  const handleBrandCreated = () => {
    loadProjects();
    // Could switch to the new brand here if needed
    setShowDropdown(false);
  };

  const handleCreateBrand = (projectId: string, projectName: string) => {
    setBrandModalContext({ projectId, projectName });
    setShowBrandModal(true);
    setShowDropdown(false);
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
          style={{ minWidth: "250px", maxHeight: "400px", overflowY: "auto" }}
        >
          <div className="dropdown-header">
            <div className="d-flex justify-content-between align-items-center w-100">
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
            <div key={project.id} className="dropdown-item-group">
              <button
                className={`dropdown-item ${
                  project.id === activeProjectId ? "active" : ""
                }`}
                onClick={() => {
                  onProjectChange(project.id);
                  setShowDropdown(false);
                }}
              >
                <div className="d-flex align-items-center justify-content-between w-100">
                  <div className="flex-grow-1">
                    <div className="fw-bold">{project.name}</div>
                    {project.git_url && (
                      <div className="small text-muted">{project.git_url}</div>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateBrand(project.id, project.name);
                      }}
                      title="Create brand for this project"
                    >
                      <i className={Icons.PLUS}></i>
                    </button>
                    {project.id === activeProjectId && (
                      <i className={Icons.CHECK}></i>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}

          <div className="dropdown-divider"></div>

          <button
            className="dropdown-item text-primary"
            onClick={() => {
              setShowProjectModal(true);
              setShowDropdown(false);
            }}
          >
            <i className={Icons.PLUS}></i> Create New Project
          </button>
        </div>
      )}

      {/* Modals */}
      <AddProjectModal
        show={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={handleProjectCreated}
      />

      {brandModalContext && (
        <AddBrandModal
          show={showBrandModal}
          projectId={brandModalContext.projectId}
          projectName={brandModalContext.projectName}
          onClose={() => {
            setShowBrandModal(false);
            setBrandModalContext(null);
          }}
          onSuccess={handleBrandCreated}
        />
      )}
    </div>
  );
}

