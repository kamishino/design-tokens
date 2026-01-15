import { useState, useEffect, useRef, useCallback } from "react";
import { Icons } from "@shared/components/Icons";
import {
  fetchOrganizations,
  createProject,
  type Organization,
  type CreateProjectRequest,
} from "@core/lib/supabase";
import AddOrganizationModal from "./AddOrganizationModal";

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
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);
  const [slugWasModified, setSlugWasModified] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (show) {
      loadOrganizations();
    }
  }, [show]);

  // PRD 0070: Dynamic organization sync - validate selectedOrgId whenever organizations list changes
  useEffect(() => {
    if (organizations.length > 0) {
      // Check if current selectedOrgId exists in the organizations list
      const isValidSelection = organizations.some(
        (org) => org.id === selectedOrgId
      );

      if (!isValidSelection) {
        // Stale ID detected - auto-select first available organization
        console.warn(
          `[PRD 0070] Stale organization ID detected: ${selectedOrgId}. ` +
            `Auto-selecting first available organization: ${organizations[0].name}`
        );
        setSelectedOrgId(organizations[0].id);
      }
    }
  }, [organizations, selectedOrgId]);

  const loadOrganizations = async () => {
    const orgs = await fetchOrganizations();
    setOrganizations(orgs);

    // PRD 0070: Validate current selection against fetched list
    if (orgs.length > 0) {
      const currentIdExists = orgs.some((org) => org.id === selectedOrgId);

      if (!currentIdExists) {
        // Current ID is stale or empty - default to first organization
        console.log(
          `[PRD 0070] Re-validating organization selection. ` +
            `Setting to: ${orgs[0].name} (${orgs[0].id})`
        );
        setSelectedOrgId(orgs[0].id);
      }
    }
  };

  const handleOrgCreated = (orgId: string) => {
    loadOrganizations();
    setSelectedOrgId(orgId);
  };

  const validateSlug = (value: string): boolean => {
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!value) {
      setSlugError("Slug is required");
      setSlugAvailable(null);
      return false;
    }
    if (!slugRegex.test(value)) {
      setSlugError(
        "Slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing/consecutive hyphens)"
      );
      setSlugAvailable(null);
      return false;
    }
    setSlugError(null);
    return true;
  };

  const suggestUniqueSlug = useCallback(
    async (baseSlug: string, orgId: string) => {
      if (!baseSlug || !orgId) {
        return;
      }

      setSlugChecking(true);
      try {
        const response = await fetch(
          `/api/mp/suggest-slug?type=project&base=${encodeURIComponent(
            baseSlug
          )}&contextId=${orgId}`
        );
        const data = await response.json();

        if (data.available) {
          setSlug(data.slug);
          setSlugAvailable(true);
          setSlugError(null);
          setSlugWasModified(data.wasModified);

          if (data.wasModified && data.suffix) {
            // Slug was auto-resolved with a suffix
            console.log(
              `Slug auto-resolved: ${data.originalBase} → ${data.slug}`
            );
          }
        } else {
          setSlugAvailable(false);
          setSlugError("Unable to generate unique slug");
        }
      } catch (error) {
        console.error("Error suggesting slug:", error);
        setSlugError("Failed to check slug availability");
      } finally {
        setSlugChecking(false);
      }
    },
    []
  );

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setAutoSlug(false);
    setSlugWasModified(false);
    validateSlug(value);

    if (slugCheckTimeoutRef.current) {
      clearTimeout(slugCheckTimeoutRef.current);
    }

    if (value && selectedOrgId) {
      slugCheckTimeoutRef.current = setTimeout(() => {
        suggestUniqueSlug(value, selectedOrgId);
      }, 300);
    }
  };

  const autoGenerateSlug = (fromName?: string) => {
    const sourceName = fromName !== undefined ? fromName : name;
    const generated = sourceName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim();

    setAutoSlug(true);

    if (slugCheckTimeoutRef.current) {
      clearTimeout(slugCheckTimeoutRef.current);
    }

    if (generated && selectedOrgId) {
      slugCheckTimeoutRef.current = setTimeout(() => {
        suggestUniqueSlug(generated, selectedOrgId);
      }, 300);
    } else {
      setSlug(generated);
      validateSlug(generated);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug || !slug) {
      autoGenerateSlug(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // PRD 0068: Validate organization selection
    if (!selectedOrgId) {
      setError("Please select an organization");
      return;
    }

    // PRD 0068: Pre-flight check - verify organization exists in local list
    const orgExists = organizations.find((org) => org.id === selectedOrgId);
    if (!orgExists) {
      setError(
        "Selected organization not found. Please refresh and try again."
      );
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
      // PRD 0068: Enhanced error handling with user-friendly messages
      const errorMessage = result.error || "Failed to create project";

      // Check for specific error scenarios
      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        setError(
          `Organization "${orgExists.name}" not found in database. ` +
            "It may have been deleted. Please refresh and select a different organization."
        );
      } else if (errorMessage.includes("violates row-level security")) {
        setError(
          "Permission denied: You don't have access to create projects in this organization. " +
            "Please contact your administrator or check your authentication."
        );
      } else if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("duplicate")
      ) {
        setError(
          `A project with slug "${slug}" already exists in this organization. ` +
            "Please use a different slug."
        );
      } else {
        setError(errorMessage);
      }
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
    setSlugAvailable(null);
    setSlugChecking(false);
    setAutoSlug(true);
    setSlugWasModified(false);
    if (slugCheckTimeoutRef.current) {
      clearTimeout(slugCheckTimeoutRef.current);
    }
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
                <div className="input-group">
                  <select
                    className="form-select"
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    required
                    disabled={loading}
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
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowOrgModal(true)}
                    disabled={loading}
                    title="Create new organization"
                  >
                    <i className={Icons.PLUS}></i>
                  </button>
                </div>
                <div className="form-text">
                  Select an organization or create a new one
                </div>
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
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Mobile App"
                  required
                  disabled={loading}
                />
                <div className="form-text">
                  Slug will be auto-generated as you type
                </div>
              </div>

              {/* Slug */}
              <div className="mb-3">
                <label className="form-label">
                  Slug <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className={`form-control ${
                      slugError
                        ? "is-invalid"
                        : slugAvailable === true
                        ? "is-valid"
                        : ""
                    }`}
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g., mobile-app"
                    required
                    disabled={loading}
                  />
                  {slugChecking && (
                    <span className="input-group-text">
                      <span className="spinner-border spinner-border-sm"></span>
                    </span>
                  )}
                  {!slugChecking && slugAvailable === true && (
                    <span className="input-group-text text-success">
                      <i className={Icons.CHECK}></i>
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => autoGenerateSlug()}
                    disabled={!name || loading}
                    title="Generate slug from name"
                  >
                    <i className={Icons.REFRESH}></i>
                  </button>
                  {slugError && (
                    <div className="invalid-feedback">{slugError}</div>
                  )}
                  {slugAvailable === true && (
                    <div className="valid-feedback">Slug is available</div>
                  )}
                </div>
                <div className="form-text">
                  {slugWasModified && autoSlug ? (
                    <span className="text-info">
                      ⚡ Auto-resolved to ensure uniqueness
                    </span>
                  ) : autoSlug ? (
                    "Auto-generated from name. Click to edit manually."
                  ) : (
                    "Lowercase letters, numbers, and hyphens only. Supports Vietnamese characters."
                  )}
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
                  loading ||
                  !selectedOrgId ||
                  !name ||
                  !slug ||
                  !!slugError ||
                  slugChecking ||
                  slugAvailable === false ||
                  // PRD 0070: Strict validation - ensure selectedOrgId exists in organizations array
                  !organizations.some((org) => org.id === selectedOrgId)
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

      {/* Organization Modal */}
      <AddOrganizationModal
        show={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        onSuccess={handleOrgCreated}
      />
    </div>
  );
}
