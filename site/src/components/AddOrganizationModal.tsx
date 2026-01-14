import { useState } from "react";
import { Icons } from "./Icons";

interface AddOrganizationModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (orgId: string) => void;
}

export default function AddOrganizationModal({
  show,
  onClose,
  onSuccess,
}: AddOrganizationModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
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

    try {
      const response = await fetch("/api/mp/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, slug }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create organization");
        setLoading(false);
        return;
      }

      // Reset form
      setName("");
      setSlug("");
      onSuccess(result.organization.id);
      onClose();
    } catch (err) {
      setError("Network error");
    }

    setLoading(false);
  };

  const handleClose = () => {
    setName("");
    setSlug("");
    setError(null);
    setSlugError(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={Icons.BRAND}></i> Create Organization
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

              {/* Organization Name */}
              <div className="mb-3">
                <label className="form-label">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  required
                  disabled={loading}
                  autoFocus
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
                    placeholder="e.g., acme-corp"
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
                    <i className={Icons.PLUS}></i> Create
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
