/**
 * Professional JSON Editor with Monaco
 * PRD 0063: Professional JSON Editor Upgrade
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Icons } from "@shared/components/Icons";

interface JSONEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean, parsed?: any) => void;
  availableTokens?: string[]; // For autocomplete
  schema?: any; // JSON Schema for validation
}

export default function JSONEditor({
  value,
  onChange,
  onValidChange,
  availableTokens = [],
  schema,
}: JSONEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Validate JSON
  const validateJSON = useCallback(
    (code: string) => {
      try {
        const parsed = JSON.parse(code);
        setError(null);
        setIsValid(true);
        setParsedData(parsed);
        onValidChange?.(true, parsed);
        return true;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Invalid JSON";
        setError(errorMsg);
        setIsValid(false);
        setParsedData(null);
        onValidChange?.(false);
        return false;
      }
    },
    [onValidChange]
  );

  // Initial validation
  useEffect(() => {
    validateJSON(value);
  }, [value, validateJSON]);

  // Configure Monaco Editor on mount
  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSON language defaults
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: schema
        ? [
            {
              uri: "http://myserver/design-tokens-schema.json",
              fileMatch: ["*"],
              schema: schema,
            },
          ]
        : [],
      enableSchemaRequest: false,
    });

    // Register token reference autocomplete provider
    if (availableTokens.length > 0) {
      monaco.languages.registerCompletionItemProvider("json", {
        triggerCharacters: ["{"],
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          // Check if we just typed a '{' for token reference
          if (textUntilPosition.endsWith("{")) {
            const suggestions: any[] = availableTokens.map((token) => ({
              label: token,
              kind: monaco.languages.CompletionItemKind.Reference,
              insertText: token + "}",
              documentation: `Token reference: {${token}}`,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            }));

            return { suggestions };
          }

          return { suggestions: [] };
        },
      });
    }
  };

  // Handle editor change with debounce
  const handleEditorChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        const isValid = validateJSON(newValue);
        if (isValid) {
          onChange(newValue);
        }
      }
    },
    [onChange, validateJSON]
  );

  // Format JSON
  const formatJSON = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Toggle preview
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className={`json-editor-wrapper ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center">
          <i className={Icons.CODE + " me-2"}></i>
          <span className="text-muted">Monaco Editor</span>
          {!isValid && (
            <span className="badge bg-danger ms-2">
              <i className={Icons.ALERT + " me-1"}></i>
              Invalid JSON
            </span>
          )}
        </div>
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-primary"
            onClick={formatJSON}
            title="Format JSON (Alt+Shift+F)"
          >
            <i className={Icons.EDIT + " me-1"}></i>
            Format
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={togglePreview}
            title="Toggle Preview"
          >
            <i
              className={
                (showPreview ? "bi bi-eye-slash" : "bi bi-eye") + " me-1"
              }
            ></i>
            Preview
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            <i
              className={
                isFullscreen ? "bi bi-fullscreen-exit" : "bi bi-fullscreen"
              }
            ></i>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-sm mb-2" role="alert">
          <i className={Icons.ALERT + " me-2"}></i>
          <strong>JSON Error:</strong> {error}
        </div>
      )}

      {/* Editor Container */}
      <div className="editor-container">
        <div className={`editor-pane ${showPreview ? "with-preview" : ""}`}>
          <div className={`card ${!isValid ? "border-danger" : ""}`}>
            <div className="card-body p-0">
              <Editor
                height={isFullscreen ? "calc(100vh - 120px)" : "500px"}
                defaultLanguage="json"
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-light"
                options={{
                  minimap: { enabled: true },
                  folding: true,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  fontSize: 14,
                  fontFamily: '"Fira Code", "Courier New", monospace',
                  formatOnPaste: true,
                  formatOnType: true,
                  autoIndent: "full",
                  tabSize: 2,
                  insertSpaces: true,
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: "on",
                  snippetSuggestions: "inline",
                }}
              />
            </div>
          </div>
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="preview-pane">
            <div className="card h-100">
              <div className="card-header">
                <i className="bi bi-eye me-2"></i>
                Live Preview
              </div>
              <div className="card-body overflow-auto">
                {parsedData ? (
                  <TokenPreview data={parsedData} />
                ) : (
                  <div className="text-muted text-center py-5">
                    <i
                      className="bi bi-code-slash"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <p className="mt-3">
                      Invalid JSON - Fix errors to see preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .json-editor-wrapper {
          width: 100%;
          position: relative;
        }
        
        .json-editor-wrapper.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background: white;
          padding: 20px;
        }

        .editor-container {
          display: flex;
          gap: 1rem;
        }

        .editor-pane {
          flex: 1;
          min-width: 0;
        }

        .editor-pane.with-preview {
          flex: 0 0 60%;
        }

        .preview-pane {
          flex: 0 0 38%;
          min-width: 0;
        }

        @media (max-width: 768px) {
          .editor-container {
            flex-direction: column;
          }
          .editor-pane.with-preview,
          .preview-pane {
            flex: 1 1 auto;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Token Preview Component
 * Renders visual representation of token JSON
 */
function TokenPreview({ data }: { data: any }) {
  const renderValue = (key: string, value: any) => {
    // Color preview
    if (typeof value === "string" && value.match(/^#[A-Fa-f0-9]{3,8}$/)) {
      return (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: value,
            }}
          ></div>
          <code>{value}</code>
        </div>
      );
    }

    // Token reference
    if (typeof value === "string" && value.match(/^\{.+\}$/)) {
      return (
        <span className="badge bg-info">
          <i className="bi bi-link-45deg me-1"></i>
          {value}
        </span>
      );
    }

    // Object
    if (typeof value === "object" && value !== null) {
      return (
        <div className="ms-3 mt-2">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="mb-2">
              <strong>{k}:</strong> {renderValue(k, v)}
            </div>
          ))}
        </div>
      );
    }

    // Primitive
    return <code>{JSON.stringify(value)}</code>;
  };

  return (
    <div className="token-preview">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-3 p-3 border rounded">
          <h6 className="text-primary mb-2">
            <i className="bi bi-box me-2"></i>
            {key}
          </h6>
          {renderValue(key, value)}
        </div>
      ))}
    </div>
  );
}
