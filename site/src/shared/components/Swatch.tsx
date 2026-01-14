/**
 * Swatch Component
 * Renders visual previews for different token types
 */

import { TokenValue } from "@core/types";

interface SwatchProps {
  token: TokenValue;
  resolvedValue?: any;
  tempValue?: any;
  onClick?: () => void;
}

export default function Swatch({
  token,
  resolvedValue,
  tempValue,
  onClick,
}: SwatchProps) {
  const type = (token.$type || token.type || "").toLowerCase();
  const value = token.$value || token.value;
  const displayValue =
    tempValue !== undefined
      ? tempValue
      : resolvedValue !== undefined
      ? resolvedValue
      : value;
  const isClickable = type === "color" && onClick;

  // Color swatch
  if (type === "color") {
    const colorValue = String(displayValue);
    return (
      <div
        className={`token-swatch token-swatch-color ${
          isClickable ? "token-swatch-clickable" : ""
        }`}
        style={{
          backgroundColor: colorValue,
          border: "1px solid rgba(0,0,0,0.1)",
          cursor: isClickable ? "pointer" : "default",
        }}
        title={colorValue}
        onClick={onClick}
      />
    );
  }

  // Dimension/Spacing swatch
  if (type === "dimension" || type === "spacing" || type === "sizing") {
    const size = parseFloat(String(displayValue));
    const maxWidth = 60;
    const width = Math.min(size, maxWidth);

    return (
      <div className="token-swatch token-swatch-dimension" title={displayValue}>
        <div
          className="dimension-bar"
          style={{
            width: `${width}px`,
            height: "4px",
            backgroundColor: "#4299e1",
            borderRadius: "2px",
          }}
        />
      </div>
    );
  }

  // Typography/Font Family swatch
  if (type === "fontfamily" || type === "typography") {
    const fontFamily = String(displayValue);
    return (
      <div className="token-swatch token-swatch-font" title={fontFamily}>
        <span style={{ fontFamily, fontSize: "14px" }}>Aa</span>
      </div>
    );
  }

  // Font Size swatch
  if (type === "fontsize") {
    return (
      <div className="token-swatch token-swatch-fontsize" title={displayValue}>
        <span style={{ fontSize: "12px", color: "#666" }}>{displayValue}</span>
      </div>
    );
  }

  // Font Weight swatch
  if (type === "fontweight") {
    return (
      <div
        className="token-swatch token-swatch-fontweight"
        title={displayValue}
      >
        <span style={{ fontWeight: displayValue, fontSize: "14px" }}>Aa</span>
      </div>
    );
  }

  // Border radius swatch
  if (type === "borderradius") {
    return (
      <div className="token-swatch token-swatch-radius" title={displayValue}>
        <div
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid #4299e1",
            borderRadius: displayValue,
          }}
        />
      </div>
    );
  }

  // Shadow swatch
  if (type === "shadow" || type === "boxshadow") {
    return (
      <div className="token-swatch token-swatch-shadow" title={displayValue}>
        <div
          style={{
            width: "20px",
            height: "20px",
            backgroundColor: "#fff",
            boxShadow: displayValue,
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        />
      </div>
    );
  }

  // Generic/Other - show icon
  return (
    <div className="token-swatch token-swatch-generic" title={type || "token"}>
      <i className="ti ti-cube" style={{ fontSize: "14px", color: "#999" }}></i>
    </div>
  );
}

// Inline styles for swatches
export const SwatchStyles = `
  .token-swatch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    margin-right: 8px;
    flex-shrink: 0;
  }

  .token-swatch-color {
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .token-swatch-dimension,
  .token-swatch-font,
  .token-swatch-fontsize,
  .token-swatch-fontweight,
  .token-swatch-radius,
  .token-swatch-shadow,
  .token-swatch-generic {
    background-color: transparent;
  }

  .dimension-bar {
    transition: all 0.2s ease;
  }
`;

