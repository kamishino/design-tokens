import { useState, useRef, useCallback } from "react";
import { Icons } from "@shared/components/Icons";
import { createBrand, type CreateBrandRequest } from "@core/lib/supabase";

interface AddBrandModalProps {
  show: boolean;
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSuccess: (brandId: string) => void;
}

export default function AddBrandModal({
  show,
  projectId,
  projectName,
  onClose,
  onSuccess,
}: AddBrandModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);
  const [slugWasModified, setSlugWasModified] = useState(false);
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    async (baseSlug: string, projId: string) => {
      if (!baseSlug || !projId) {
        return;
      }

      setSlugChecking(true);
      try {
        const response = await fetch(
          `/api/mp/suggest-slug?type=brand&base=${encodeURIComponent(
            baseSlug
          )}&contextId=${projId}`
        );
        const data = await response.json();

        if (data.available) {
          setSlug(data.slug);
          setSlugAvailable(true);
          setSlugError(null);
          setSlugWasModified(data.wasModified);

          if (data.wasModified && data.suffix) {
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

    if (value && projectId) {
      slugCheckTimeoutRef.current = setTimeout(() => {
        suggestUniqueSlug(value, projectId);
      }, 300);
    }
  };

  const autoGenerateSlug = () => {
    const generated = name
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

    if (generated && projectId) {
      slugCheckTimeoutRef.current = setTimeout(() => {
        suggestUniqueSlug(generated, projectId);
      }, 300);
    } else {
      setSlug(generated);
      validateSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSlug(slug)) {
      return;
    }

    setLoading(true);
    setError(null);

    const brandData: CreateBrandRequest = {
      name,
      slug,
      description: description || undefined,
      is_default: isDefault,
    };

    const result = await createBrand(projectId, brandData);

    if (result.success && result.brand) {
      // Reset form
      setName("");
      setSlug("");
      setDescription("");
      setIsDefault(false);
      onSuccess(result.brand.id);
      onClose();
    } else {
      setError(result.error || "Failed to create brand");
    }

    setLoading(false);
  };

  const handleClose = () => {
    setName("");
    setSlug("");
    setDescription("");
    setIsDefault(false);
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
              <i className={Icons.TAG}></i> Create New Brand
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

              {/* Project Context */}
              <div className="alert alert-info mb-3">
                <strong>Project:</strong> {projectName}
              </div>

              {/* Brand Name */}
              <div className="mb-3">
                <label className="form-label">
                  Brand Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (autoSlug || !slug) {
                      const generated = e.target.value
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
                      setSlug(generated);
                      validateSlug(generated);

                      if (slugCheckTimeoutRef.current) {
                        clearTimeout(slugCheckTimeoutRef.current);
                      }
                      if (generated && projectId) {
                        slugCheckTimeoutRef.current = setTimeout(() => {
                          suggestUniqueSlug(generated, projectId);
                        }, 300);
                      }
                    }
                  }}
                  placeholder="e.g., Dark Mode, Summer Campaign"
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
                    className={`form-control ${
                      slugError
                        ? "is-invalid"
                        : slugAvailable === true
                        ? "is-valid"
                        : ""
                    }`}
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g., dark-mode"
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
                    onClick={autoGenerateSlug}
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
                  placeholder="Brief brand description"
                  rows={2}
                  disabled={loading}
                />
              </div>

              {/* Set as Default */}
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="isDefault">
                  Set as default brand
                </label>
                <div className="form-text">
                  This brand will be used when no specific brand is selected
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
                  !name ||
                  !slug ||
                  !!slugError ||
                  slugChecking ||
                  slugAvailable === false
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className={Icons.PLUS}></i> Create Brand
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
