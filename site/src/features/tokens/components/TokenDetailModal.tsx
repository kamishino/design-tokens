/**
 * Token Detail Modal Component
 * PRD 0064: Advanced Token Management System
 * 
 * Read-only view showing comprehensive token information with copy functionality
 */

import { useState } from 'react';
import { Icons } from '@shared/components/Icons';
import { copyToClipboard } from '../utils/exportUtils';
import type { Token } from '../hooks/useTokenCollection';

interface TokenDetailModalProps {
  token: Token | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function TokenDetailModal({
  token,
  isOpen,
  onClose,
  onEdit,
}: TokenDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !token) return null;

  const handleCopy = async (text: string, fieldName: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderValuePreview = (value: any, type: string) => {
    // Color preview
    if (type === 'color' && typeof value === 'string' && value.match(/^#[A-Fa-f0-9]{3,8}$/)) {
      return (
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              border: '2px solid #dee2e6',
              backgroundColor: value,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          ></div>
          <code className="fs-5">{value}</code>
        </div>
      );
    }

    // Token reference
    if (typeof value === 'string' && value.match(/^\{.+\}$/)) {
      return (
        <div className="badge bg-info fs-6 py-2 px-3">
          <i className="bi bi-link-45deg me-2"></i>
          {value}
        </div>
      );
    }

    // Object/complex value
    if (typeof value === 'object' && value !== null) {
      return (
        <pre className="bg-light p-3 rounded">
          <code>{JSON.stringify(value, null, 2)}</code>
        </pre>
      );
    }

    // Default
    return <code className="fs-5">{String(value)}</code>;
  };

  const tokenReference = `{${token.path}}`;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-eye me-2"></i>
                Token Details
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Token Path with Copy */}
              <div className="card mb-3 border-primary">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <small className="text-muted text-uppercase">Token Path</small>
                      <h4 className="mb-0 mt-1">{token.path}</h4>
                    </div>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleCopy(token.path, 'path')}
                      title="Copy path"
                    >
                      <i className={copiedField === 'path' ? 'bi bi-check2' : 'bi bi-clipboard'}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Token Reference with Copy */}
              <div className="card mb-3 bg-light">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted text-uppercase">Reference Syntax</small>
                      <div className="mt-1">
                        <code className="fs-5">{tokenReference}</code>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleCopy(tokenReference, 'reference')}
                      title="Copy reference"
                    >
                      <i className={copiedField === 'reference' ? 'bi bi-check2' : 'bi bi-clipboard'}></i>
                      {copiedField === 'reference' ? ' Copied!' : ' Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Token Information */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Name</label>
                  <div className="p-2 bg-light rounded">{token.name}</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Type</label>
                  <div>
                    <span className="badge bg-secondary fs-6 py-2 px-3">{token.type}</span>
                  </div>
                </div>
              </div>

              {/* Value Preview */}
              <div className="mb-3">
                <label className="form-label fw-bold">Value</label>
                <div className="p-3 border rounded">
                  {renderValuePreview(token.value, token.type)}
                </div>
              </div>

              {/* Raw Value with Copy */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold mb-0">Raw Value</label>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleCopy(formatValue(token.value), 'value')}
                    title="Copy value"
                  >
                    <i className={copiedField === 'value' ? 'bi bi-check2' : 'bi bi-clipboard'}></i>
                  </button>
                </div>
                <pre className="bg-light p-3 rounded mb-0">
                  <code>{formatValue(token.value)}</code>
                </pre>
              </div>

              {/* Description */}
              {token.description && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Description</label>
                  <div className="p-2 bg-light rounded">{token.description}</div>
                </div>
              )}

              {/* Additional Metadata */}
              <div className="row">
                {token.brand && (
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Brand</label>
                    <div className="p-2 bg-light rounded">{token.brand}</div>
                  </div>
                )}

                {token.theme && (
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Theme</label>
                    <div className="p-2 bg-light rounded">{token.theme}</div>
                  </div>
                )}

                {token.status && (
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Status</label>
                    <div>
                      <span className={`badge ${
                        token.status === 'active' ? 'bg-success' :
                        token.status === 'deprecated' ? 'bg-warning' :
                        'bg-info'
                      } fs-6 py-2 px-3`}>
                        {token.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="row">
                {token.created_at && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Created</label>
                    <div className="p-2 bg-light rounded">
                      <small>{new Date(token.created_at).toLocaleString()}</small>
                    </div>
                  </div>
                )}

                {token.updated_at && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Last Updated</label>
                    <div className="p-2 bg-light rounded">
                      <small>{new Date(token.updated_at).toLocaleString()}</small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              {onEdit && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onEdit();
                  }}
                >
                  <i className={Icons.EDIT + " me-2"}></i>
                  Edit Token
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
