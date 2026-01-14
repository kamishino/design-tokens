import { useState } from "react";
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

  const validateSlug = (value: string): boolean => {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!value) {
      setSlugError("Slug is required");
      return false;
    }
    if (!slugRegex.test(value)) {
      setSlugError("Slug must contain only lowercase letters, numbers, and hyphens");
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
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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
                  onChange={(e) => setName(e.target.value)}
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
                    className={`form-control ${slugError ? "is-invalid" : ""}`}
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g., dark-mode"
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
                  {slugError && <div className="invalid-feedback">{slugError}</div>}
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
                disabled={loading || !name || !slug || !!slugError}
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

