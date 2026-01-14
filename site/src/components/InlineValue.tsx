/**
 * InlineValue Component
 * Renders token values with inline color swatches for color types
 * Supports clipboard copy on swatch click
 */

import { useState } from "react";
import { isHexColor } from "@shared/utils/token-logic";

interface InlineValueProps {
  value: any;
  type?: string;
  isReference?: boolean;
  className?: string;
}

export default function InlineValue({ value, type, isReference = false, className = "" }: InlineValueProps) {
  const [showCopied, setShowCopied] = useState(false);

  const valueStr = String(value);
  const tokenType = (type || "").toLowerCase();
  const isColorType = tokenType === "color";
  const isValidHex = isColorType && isHexColor(valueStr);

  const handleCopyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(valueStr);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <span className={`inline-value ${className}`} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {isValidHex && (
        <>
          <span
            className="color-swatch"
            onClick={handleCopyToClipboard}
            style={{
              display: "inline-block",
              width: "12px",
              height: "12px",
              backgroundColor: valueStr,
              border: "1px solid rgba(0, 0, 0, 0.2)",
              borderRadius: "2px",
              cursor: "pointer",
              verticalAlign: "middle",
              flexShrink: 0,
            }}
            title={`Click to copy: ${valueStr}`}
          />
          {showCopied && (
            <span
              className="copied-tooltip"
              style={{
                position: "absolute",
                top: "-24px",
                left: "0",
                backgroundColor: "#000",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                whiteSpace: "nowrap",
                zIndex: 1000,
                pointerEvents: "none",
              }}
            >
              Copied!
            </span>
          )}
        </>
      )}
      <code className={`${isReference ? "text-purple" : "text-primary"}`}>
        {valueStr}
      </code>
    </span>
  );
}


