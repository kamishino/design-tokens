import { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import { Icons } from "./Icons";

// Extend Prism to highlight HEX colors
if (typeof window !== "undefined" && Prism.languages.json) {
  Prism.languages.json = Prism.languages.extend("json", {
    hexcolor: {
      pattern: /"#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})"/,
      greedy: true,
    },
  });
}

interface JSONEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean, parsed?: any) => void;
}

export default function JSONEditor({ value, onChange, onValidChange }: JSONEditorProps) {
  const [code, setCode] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Sync with parent value
  useEffect(() => {
    setCode(value);
  }, [value]);

  const validateAndUpdate = (newCode: string) => {
    setCode(newCode);

    try {
      const parsed = JSON.parse(newCode);
      setError(null);
      setIsValid(true);
      onChange(newCode);
      onValidChange?.(true, parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setIsValid(false);
      onValidChange?.(false);
    }
  };

  // Apply color to HEX indicators after render
  useEffect(() => {
    const hexElements = document.querySelectorAll('.hex-color-value');
    hexElements.forEach((el) => {
      const color = el.getAttribute('data-color');
      if (color) {
        (el as HTMLElement).style.setProperty('--hex-color', color);
      }
    });
  }, [code]);

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(code);
      const formatted = JSON.stringify(parsed, null, 2);
      setCode(formatted);
      onChange(formatted);
      setError(null);
      setIsValid(true);
      onValidChange?.(true, parsed);
    } catch (e) {
      setError("Cannot format invalid JSON");
    }
  };

  return (
    <div className="json-editor-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center">
          <i className={Icons.CODE + " me-2"}></i>
          <span className="text-muted">JSON Editor</span>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={formatJSON} disabled={!isValid}>
          <i className={Icons.EDIT + " me-1"}></i>
          Format
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-sm mb-2" role="alert">
          <i className={Icons.ALERT + " me-2"}></i>
          <strong>JSON Error:</strong> {error}
        </div>
      )}

      <div className={`card ${!isValid ? "border-danger" : ""}`}>
        <div className="card-body p-0" style={{ position: "relative" }}>
          <Editor
            value={code}
            onValueChange={validateAndUpdate}
            highlight={(code) => {
              const highlighted = Prism.highlight(code, Prism.languages.json, "json");
              // Add visual color indicators for HEX codes
              return highlighted.replace(
                /"(#[A-Fa-f0-9]{3,8})"/g,
                (match, hex) => `<span class="hex-color-value" data-color="${hex}">${match}</span>`
              );
            }}
            padding={16}
            style={{
              fontFamily: '"Fira Code", "Courier New", monospace',
              fontSize: 14,
              minHeight: "400px",
              maxHeight: "600px",
              overflow: "auto",
              backgroundColor: "#f8f9fa",
            }}
            textareaClassName="json-editor-textarea"
          />
        </div>
      </div>

      <style>{`
        .json-editor-wrapper {
          width: 100%;
        }
        .json-editor-textarea {
          outline: none !important;
        }
        .json-editor-textarea:focus {
          outline: none !important;
        }
        
        /* HEX Color Highlighting */
        .hex-color-value {
          position: relative;
          font-weight: bold;
          padding-left: 20px;
        }
        .hex-color-value::before {
          content: '';
          position: absolute;
          left: 2px;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          border-radius: 2px;
          background-color: var(--hex-color);
          border: 1px solid rgba(0, 0, 0, 0.2);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
