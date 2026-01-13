import { useState } from "react";
import { TokenContent } from "../types";
import TokenTree from "./TokenTree";
import JSONEditor from "./JSONEditor";
import { Icons } from "./Icons";

type ViewMode = "tree" | "code";

interface TokenEditorProps {
  filePath: string;
  content: TokenContent;
  onUpdate: (path: string[], newValue: any) => void;
  hasChanges: boolean;
  allTokens?: Record<string, TokenContent>;
  onNavigateToToken?: (tokenPath: string) => void;
  baselineContent?: TokenContent | null;
  onRevertToken?: (path: string[]) => void;
  onDeleteToken?: (path: string[]) => void;
  onAddToGroup?: (path: string[], mode: "group" | "token") => void;
  onEditToken?: (path: string[]) => void;
}

export default function TokenEditor({
  filePath,
  content,
  onUpdate,
  hasChanges,
  allTokens = {},
  onNavigateToToken,
  baselineContent = null,
  onRevertToken,
  onDeleteToken,
  onAddToGroup,
  onEditToken,
}: TokenEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);
  const [jsonString, setJsonString] = useState(
    JSON.stringify(content, null, 2)
  );

  const handleJSONChange = (newJson: string) => {
    setJsonString(newJson);
  };

  const handleValidChange = (isValid: boolean, parsed?: any) => {
    if (isValid && parsed) {
      // Update all token paths from the parsed JSON
      Object.keys(parsed).forEach((key) => {
        onUpdate([key], parsed[key]);
      });
    }
  };

  const handleExpandAll = () => {
    setExpandAll(true);
    setTimeout(() => setExpandAll(undefined), 100);
  };

  const handleCollapseAll = () => {
    setExpandAll(false);
    setTimeout(() => setExpandAll(undefined), 100);
  };
  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center w-100">
          <h3 className="card-title mb-0">
            <i className={Icons.FILE_CODE + " me-2"}></i>
            {filePath}
          </h3>
          <div className="d-flex align-items-center gap-2">
            {hasChanges && <span className="badge bg-green-lt">Modified</span>}

            {/* View Mode Toggle */}
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${
                  viewMode === "tree" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setViewMode("tree")}
              >
                <i className={Icons.LAYERS + " me-1"}></i>
                Tree
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  viewMode === "code" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setViewMode("code")}
              >
                <i className={Icons.CODE + " me-1"}></i>
                Code
              </button>
            </div>

            {/* Expand/Collapse Controls (only in tree mode) */}
            {viewMode === "tree" && (
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleExpandAll}
                  title="Expand All"
                >
                  <i className={Icons.CHEVRON_DOWN}></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleCollapseAll}
                  title="Collapse All"
                >
                  <i className={Icons.CHEVRON_RIGHT}></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-body">
        {viewMode === "tree" ? (
          content ? (
            <TokenTree
              data={content}
              path={[]}
              onUpdate={onUpdate}
              expandAll={expandAll}
              allTokens={allTokens}
              onNavigateToToken={onNavigateToToken}
              baselineContent={baselineContent}
              onRevertToken={onRevertToken}
              onDeleteToken={onDeleteToken}
              onAddToGroup={onAddToGroup}
              onEditToken={onEditToken}
            />
          ) : (
            <div className="text-center text-muted py-5">
              <i className="ti ti-loader"></i> Loading...
            </div>
          )
        ) : (
          <JSONEditor
            value={jsonString}
            onChange={handleJSONChange}
            onValidChange={handleValidChange}
          />
        )}
      </div>
    </div>
  );
}
