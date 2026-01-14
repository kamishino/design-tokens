import { useState, useEffect } from "react";
import { Icons } from "./Icons";
import {
  fetchOrganizations,
  createProject,
  type Organization,
  type CreateProjectRequest,
} from "../lib/supabase";

interface AddProjectModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

export default function AddProjectModal({
  show,
  onClose,
  onSuccess,
}: AddProjectModalProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [gitUrl, setGitUrl] = useState("");
  const [createDefaultBrand, setCreateDefaultBrand] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      loadOrganizations();
    }
  }, [show]);

  const loadOrganizations = async () => {
    const orgs = await fetchOrganizations();
    setOrganizations(orgs);
    if (orgs.length > 0) {
      setSelectedOrgId(orgs[0].id);
    }
  };

  const validateSlug = (value: string): boolean => {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!value) {
      setSlugError("Slug is required");
      return false;
    }
    if (!slugRegex.test(value)) {
      setSlugError(
        "Slug must contain only lowercase letters, numbers, and hyphens"
      );
      return false;
    }
    setSlugError(null);
    return true;
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    validateSlug(value);
  };

  const autoGenerateSlug = () => {
    const generated = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setSlug(generated);
    validateSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrgId) {
      setError("Please select an organization");
      return;
    }

    if (!validateSlug(slug)) {
      return;
    }

    setLoading(true);
    setError(null);

    const projectData: CreateProjectRequest = {
      name,
      slug,
      description: description || undefined,
      git_url: gitUrl || undefined,
      create_default_brand: createDefaultBrand,
    };

    const result = await createProject(selectedOrgId, projectData);

    if (result.success && result.project) {
      // Reset form
      setName("");
      setSlug("");
      setDescription("");
      setGitUrl("");
      setCreateDefaultBrand(true);
      onSuccess(result.project.id);
      onClose();
    } else {
      setError(result.error || "Failed to create project");
    }

    setLoading(false);
  };

  const handleClose = () => {
    setName("");
    setSlug("");
    setDescription("");
    setGitUrl("");
    setError(null);
    setSlugError(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={Icons.FOLDER}></i> Create New Project
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Organization Selection */}
              <div className="mb-3">
                <label className="form-label">
                  Organization <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  required
                  disabled={loading || organizations.length === 0}
                >
                  {organizations.length === 0 && (
                    <option value="">No organizations found</option>
                  )}
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {organizations.length === 0 && (
                  <div className="form-text text-muted">
                    Create an organization in Supabase first
                  </div>
                )}
              </div>

              {/* Project Name */}
              <div className="mb-3">
                <label className="form-label">
                  Project Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mobile App"
                  required
                  disabled={loading}
                />
              </div>

              {/* Slug */}
              <div className="mb-3">
                <label className="form-label">
                  Slug <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className={`form-control ${slugError ? "is-invalid" : ""}`}
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g., mobile-app"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={autoGenerateSlug}
                    disabled={!name || loading}
                    title="Generate slug from name"
                  >
                    <i className={Icons.REFRESH}></i>
                  </button>
                  {slugError && (
                    <div className="invalid-feedback">{slugError}</div>
                  )}
                </div>
                <div className="form-text">
                  Lowercase letters, numbers, and hyphens only
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief project description"
                  rows={2}
                  disabled={loading}
                />
              </div>

              {/* Git URL */}
              <div className="mb-3">
                <label className="form-label">Git Repository URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  disabled={loading}
                />
              </div>

              {/* Create Default Brand */}
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="createDefaultBrand"
                  checked={createDefaultBrand}
                  onChange={(e) => setCreateDefaultBrand(e.target.checked)}
                  disabled={loading}
                />
                <label
                  className="form-check-label"
                  htmlFor="createDefaultBrand"
                >
                  Create default brand
                </label>
                <div className="form-text">
                  Automatically create a "Default" brand for this project
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  loading || !selectedOrgId || !name || !slug || !!slugError
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className={Icons.PLUS}></i> Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
