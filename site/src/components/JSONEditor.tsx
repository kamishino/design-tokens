import { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import { Icons } from "./Icons";

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
            highlight={(code) => Prism.highlight(code, Prism.languages.json, "json")}
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
      `}</style>
    </div>
  );
}
