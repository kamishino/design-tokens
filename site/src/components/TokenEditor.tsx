import { TokenContent } from "../types";
import TokenTree from "./TokenTree";

interface TokenEditorProps {
  filePath: string;
  content: TokenContent;
  onUpdate: (path: string[], newValue: any) => void;
  hasChanges: boolean;
}

export default function TokenEditor({ filePath, content, onUpdate, hasChanges }: TokenEditorProps) {
  return (
    <div className="token-editor">
      <div className="editor-header">
        <h2 className="editor-title">
          {filePath}
          {hasChanges && <span className="modified-badge">Modified</span>}
        </h2>
      </div>

      <div className="editor-content">
        <TokenTree data={content} path={[]} onUpdate={onUpdate} />
      </div>
    </div>
  );
}
