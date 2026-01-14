/**
 * Kitchen Sink Component
 *
 * Showcases all Tabler UI components used in the Token Management Dashboard.
 * Serves as a visual reference and testing ground for the design system.
 */

import { Icons } from "@shared/components/Icons";

export default function KitchenSink() {
  return (
    <div className="container-xl">
      <div className="page-header">
        <h1 className="page-title">
          <i className={Icons.PALETTE + " me-2"}></i>
          UI Kitchen Sink
        </h1>
        <div className="text-muted">Showcase of all Tabler UI components used in the dashboard</div>
      </div>

      <div className="row row-deck row-cards">
        {/* Buttons Section */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Buttons</h3>
            </div>
            <div className="card-body">
              <div className="btn-list">
                <button className="btn btn-primary">
                  <i className={Icons.ADD + " me-1"}></i>
                  Primary
                </button>
                <button className="btn btn-secondary">Secondary</button>
                <button className="btn btn-success">
                  <i className={Icons.CHECK + " me-1"}></i>
                  Success
                </button>
                <button className="btn btn-danger">
                  <i className={Icons.DELETE + " me-1"}></i>
                  Danger
                </button>
                <button className="btn btn-warning">Warning</button>
                <button className="btn btn-info">Info</button>
                <button className="btn btn-outline-primary">Outline Primary</button>
                <button className="btn btn-outline-secondary">Outline Secondary</button>
                <button className="btn btn-ghost-primary">Ghost Primary</button>
                <button className="btn" disabled>
                  Disabled
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Alerts</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-success" role="alert">
                <div className="d-flex">
                  <div>
                    <i className={Icons.SUCCESS}></i>
                  </div>
                  <div className="ms-2">
                    <h4 className="alert-title">Success!</h4>
                    <div className="text-muted">Your changes have been saved successfully.</div>
                  </div>
                </div>
              </div>

              <div className="alert alert-danger" role="alert">
                <div className="d-flex">
                  <div>
                    <i className={Icons.ERROR}></i>
                  </div>
                  <div className="ms-2">
                    <h4 className="alert-title">Error!</h4>
                    <div className="text-muted">Something went wrong with your request.</div>
                  </div>
                </div>
              </div>

              <div className="alert alert-warning" role="alert">
                <div className="d-flex">
                  <div>
                    <i className={Icons.WARNING}></i>
                  </div>
                  <div className="ms-2">
                    <h4 className="alert-title">Warning!</h4>
                    <div className="text-muted">Please review your changes before continuing.</div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info" role="alert">
                <div className="d-flex">
                  <div>
                    <i className={Icons.INFO}></i>
                  </div>
                  <div className="ms-2">
                    <h4 className="alert-title">Info</h4>
                    <div className="text-muted">New updates are available for your tokens.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Controls Section */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Form Controls</h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Text Input</label>
                <input type="text" className="form-control" placeholder="Enter text..." />
              </div>

              <div className="mb-3">
                <label className="form-label">Valid Input</label>
                <input type="text" className="form-control is-valid" value="#3b82f6" readOnly />
                <div className="valid-feedback">Looks good!</div>
              </div>

              <div className="mb-3">
                <label className="form-label">Invalid Input</label>
                <input type="text" className="form-control is-invalid" value="" />
                <div className="invalid-feedback">This field is required.</div>
              </div>

              <div className="mb-3">
                <label className="form-label">Select</label>
                <select className="form-select">
                  <option>Choose an option...</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Textarea</label>
                <textarea className="form-control" rows={3} placeholder="Enter description..."></textarea>
              </div>

              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="check1" />
                <label className="form-check-label" htmlFor="check1">
                  Checkbox option
                </label>
              </div>

              <div className="form-check">
                <input className="form-check-input" type="radio" name="radio" id="radio1" />
                <label className="form-check-label" htmlFor="radio1">
                  Radio option
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Badges & Status Section */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Badges & Status</h3>
            </div>
            <div className="card-body">
              <h4 className="mb-3">Badges</h4>
              <div className="mb-3">
                <span className="badge bg-primary me-1">Primary</span>
                <span className="badge bg-secondary me-1">Secondary</span>
                <span className="badge bg-success me-1">Success</span>
                <span className="badge bg-danger me-1">Danger</span>
                <span className="badge bg-warning me-1">Warning</span>
                <span className="badge bg-info me-1">Info</span>
              </div>

              <h4 className="mb-3">Light Badges</h4>
              <div className="mb-3">
                <span className="badge bg-blue-lt me-1">Blue</span>
                <span className="badge bg-azure-lt me-1">Azure</span>
                <span className="badge bg-green-lt me-1">Green</span>
                <span className="badge bg-red-lt me-1">Red</span>
                <span className="badge bg-yellow-lt me-1">Yellow</span>
              </div>

              <h4 className="mb-3">Status Dots</h4>
              <div>
                <span className="status-dot status-dot-animated bg-green me-2"></span>
                <span className="text-muted">Active</span>
              </div>
              <div className="mt-2">
                <span className="status-dot bg-red me-2"></span>
                <span className="text-muted">Error</span>
              </div>
              <div className="mt-2">
                <span className="status-dot bg-yellow me-2"></span>
                <span className="text-muted">Warning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Loading Section */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Progress & Loading</h3>
            </div>
            <div className="card-body">
              <h4 className="mb-3">Progress Bars</h4>
              <div className="progress mb-2">
                <div className="progress-bar" style={{ width: "25%" }}>
                  25%
                </div>
              </div>
              <div className="progress mb-2">
                <div className="progress-bar bg-success" style={{ width: "50%" }}>
                  50%
                </div>
              </div>
              <div className="progress mb-3">
                <div className="progress-bar bg-danger" style={{ width: "75%" }}>
                  75%
                </div>
              </div>

              <h4 className="mb-3">Spinners</h4>
              <div className="spinner-border text-primary me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="spinner-border text-success me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="spinner-border spinner-border-sm text-danger me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="spinner-grow text-info me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Section */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Empty State</h3>
            </div>
            <div className="card-body">
              <div className="empty">
                <div className="empty-icon">
                  <i className={Icons.FILES}></i>
                </div>
                <p className="empty-title">No files found</p>
                <p className="empty-subtitle text-muted">Select a token file from the sidebar to get started</p>
                <div className="empty-action">
                  <button className="btn btn-primary">
                    <i className={Icons.ADD + " me-1"}></i>
                    Create new file
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* List Groups Section */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">List Groups</h3>
            </div>
            <div className="list-group list-group-flush">
              <div className="list-group-item">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="badge bg-blue-lt">token.key</span>
                  </div>
                  <div className="col">
                    <code className="text-primary">#3b82f6</code>
                  </div>
                  <div className="col-auto">
                    <span className="badge bg-azure-lt">color</span>
                  </div>
                </div>
              </div>
              <div className="list-group-item">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="badge bg-blue-lt">spacing.md</span>
                  </div>
                  <div className="col">
                    <code className="text-primary">16px</code>
                  </div>
                  <div className="col-auto">
                    <span className="badge bg-azure-lt">dimension</span>
                  </div>
                </div>
              </div>
              <div className="list-group-item active">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="badge bg-blue">font.size.base</span>
                  </div>
                  <div className="col">
                    <code className="text-white">16px</code>
                  </div>
                  <div className="col-auto">
                    <span className="badge bg-azure">dimension</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Icons Section */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Icon Registry</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6 col-sm-4 col-md-3">
                  <div className="text-center">
                    <i className={Icons.ADD + " fs-2 text-primary"}></i>
                    <div className="small text-muted mt-1">Add</div>
                  </div>
                </div>
                <div className="col-6 col-sm-4 col-md-3">
                  <div className="text-center">
                    <i className={Icons.EDIT + " fs-2 text-primary"}></i>
                    <div className="small text-muted mt-1">Edit</div>
                  </div>
                </div>
                <div className="col-6 col-sm-4 col-md-3">
                  <div className="text-center">
                    <i className={Icons.DELETE + " fs-2 text-danger"}></i>
                    <div className="small text-muted mt-1">Delete</div>
                  </div>
                </div>
                <div className="col-6 col-sm-4 col-md-3">
                  <div className="text-center">
                    <i className={Icons.SAVE + " fs-2 text-success"}></i>
                    <div className="small text-muted mt-1">Save</div>
                  </div>
                </div>
                <div className="col-6 col-sm-4 col-md-3">
                  <div className="text-center">
                    <i className={Icons.PALETTE + " fs-2 text-primary"}></i>
                    <div className="small text-muted mt-1">Palette</div>
                  </div>
                </div>
                <div className="col-6 col-sm-4 col-md-3">
                  <div className="text-center">
                    <i className={Icons.FILES + " fs-2 text-primary"}></i>
                    <div className="small text-muted mt-1">Files</div>
                  </div>
                </div>
                <div className="col-6 col-sm-4 col-md-3">
                  <div className="text-center">
                    <i className={Icons.SEARCH + " fs-2 text-primary"}></i>
                    <div className="small text-muted mt-1">Search</div>
                  </div>
                </div>
                <div className="col-6 col-sm-4 col-md-3">
                  <div className="text-center">
                    <i className={Icons.SETTINGS + " fs-2 text-primary"}></i>
                    <div className="small text-muted mt-1">Settings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

