/**
 * Type-Specific Editors
 * Specialized UI controls for complex token types
 */

import { useState } from "react";

interface DimensionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}

export function DimensionEditor({
  value,
  onChange,
  onCommit,
}: DimensionEditorProps) {
  const parseValue = (val: string) => {
    const match = String(val).match(/^([-\d.]+)\s*([a-z%]*)$/i);
    return {
      number: match ? parseFloat(match[1]) : 0,
      unit: match && match[2] ? match[2] : "px",
    };
  };

  const { number, unit } = parseValue(value);
  const [numValue, setNumValue] = useState(number);
  const [unitValue, setUnitValue] = useState(unit);

  const units = ["px", "rem", "em", "%", "vh", "vw"];

  const handleChange = (newNum: number, newUnit: string) => {
    setNumValue(newNum);
    setUnitValue(newUnit);
    onChange(`${newNum}${newUnit}`);
  };

  return (
    <div className="d-flex gap-2 align-items-center">
      <input
        type="number"
        className="form-control form-control-sm"
        style={{ width: "100px" }}
        value={numValue}
        onChange={(e) =>
          handleChange(parseFloat(e.target.value) || 0, unitValue)
        }
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
        }}
        step="0.1"
      />
      <select
        className="form-select form-select-sm"
        style={{ width: "80px" }}
        value={unitValue}
        onChange={(e) => handleChange(numValue, e.target.value)}
        onBlur={onCommit}
      >
        {units.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ShadowEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}

export function ShadowEditor({ value, onChange, onCommit }: ShadowEditorProps) {
  const parseShadow = (val: string) => {
    // Parse shadow values handling rgba() colors: "2px 4px 8px rgba(0, 0, 0, 0.5)"
    // Use regex to match either parenthesized groups OR non-space sequences
    const parts =
      String(val)
        .trim()
        .match(/\S+\(.*?\)\S*|\S+/g) || [];

    if (parts.length >= 4) {
      // Check if we have 4 or 5 parts
      // 4 parts: x y blur color
      // 5 parts: x y blur spread color
      return {
        x: parts[0],
        y: parts[1],
        blur: parts[2],
        spread: parts.length === 5 ? parts[3] : "0px",
        color: parts.length === 5 ? parts[4] : parts[3],
      };
    }
    return { x: "0px", y: "0px", blur: "0px", spread: "0px", color: "#000000" };
  };

  const shadow = parseShadow(value);
  const [x, setX] = useState(shadow.x);
  const [y, setY] = useState(shadow.y);
  const [blur, setBlur] = useState(shadow.blur);
  const [spread, setSpread] = useState(shadow.spread);
  const [color, setColor] = useState(shadow.color);

  const updateShadow = (
    newX: string,
    newY: string,
    newBlur: string,
    newSpread: string,
    newColor: string
  ) => {
    setX(newX);
    setY(newY);
    setBlur(newBlur);
    setSpread(newSpread);
    setColor(newColor);
    // Omit spread if it's 0
    const spreadPart =
      newSpread && newSpread !== "0px" && newSpread !== "0"
        ? ` ${newSpread}`
        : "";
    onChange(`${newX} ${newY} ${newBlur}${spreadPart} ${newColor}`);
  };

  return (
    <div className="shadow-editor">
      <div className="row g-2">
        <div className="col-6 col-md-3">
          <label className="form-label small mb-1">X Offset</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={x}
            onChange={(e) =>
              updateShadow(e.target.value, y, blur, spread, color)
            }
            onBlur={onCommit}
            placeholder="2px"
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small mb-1">Y Offset</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={y}
            onChange={(e) =>
              updateShadow(
                x || "0px",
                e.target.value,
                blur || "0px",
                spread || "0px",
                color || "#000000"
              )
            }
            onBlur={onCommit}
            placeholder="4px"
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small mb-1">Blur</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={blur}
            onChange={(e) =>
              updateShadow(
                x || "0px",
                y || "0px",
                e.target.value,
                spread || "0px",
                color || "#000000"
              )
            }
            onBlur={onCommit}
            placeholder="8px"
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small mb-1">Spread</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={spread}
            onChange={(e) =>
              updateShadow(
                x || "0px",
                y || "0px",
                blur || "0px",
                e.target.value,
                color || "#000000"
              )
            }
            onBlur={onCommit}
            placeholder="0px"
          />
        </div>
        <div className="col-12">
          <label className="form-label small mb-1">Color</label>
          <div className="d-flex gap-2 align-items-center">
            <input
              type="color"
              className="form-control form-control-color form-control-sm"
              style={{ width: "50px" }}
              value={color}
              onChange={(e) =>
                updateShadow(
                  x || "0px",
                  y || "0px",
                  blur || "0px",
                  spread || "0px",
                  e.target.value
                )
              }
              onBlur={onCommit}
            />
            <input
              type="text"
              className="form-control form-control-sm"
              value={color}
              onChange={(e) =>
                updateShadow(
                  x || "0px",
                  y || "0px",
                  blur || "0px",
                  spread || "0px",
                  e.target.value
                )
              }
              onBlur={onCommit}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
      <div className="mt-2">
        <div className="small text-muted">Preview:</div>
        <div
          className="shadow-preview"
          style={{
            width: "100px",
            height: "60px",
            backgroundColor: "#fff",
            boxShadow: `${x} ${y} ${blur}${
              spread && spread !== "0px" ? ` ${spread}` : ""
            } ${color}`,
            border: "1px solid #dee2e6",
            borderRadius: "4px",
          }}
        ></div>
      </div>
    </div>
  );
}

interface TypographyEditorProps {
  value: any; // Could be string or composite object
  onChange: (value: any) => void;
  onCommit: () => void;
}

export function TypographyEditor({
  value,
  onChange,
  onCommit,
}: TypographyEditorProps) {
  // Typography can be a composite object or simple string
  const isComposite = typeof value === "object" && value !== null;
  const isString = typeof value === "string";
  const wasOriginallyString = isString;

  const [fontFamily, setFontFamily] = useState(
    isComposite ? value.fontFamily || "" : ""
  );
  const [fontSize, setFontSize] = useState(
    isComposite ? value.fontSize || "" : isString ? value : ""
  );
  const [fontWeight, setFontWeight] = useState(
    isComposite ? value.fontWeight || "" : ""
  );
  const [lineHeight, setLineHeight] = useState(
    isComposite ? value.lineHeight || "" : ""
  );

  const updateTypography = (
    family: string,
    size: string,
    weight: string,
    height: string
  ) => {
    setFontFamily(family);
    setFontSize(size);
    setFontWeight(weight);
    setLineHeight(height);

    // If original was a string and only fontSize was edited, return string
    if (wasOriginallyString && !family && !weight && !height) {
      onChange(size);
    } else {
      // Otherwise return composite object
      onChange({
        fontFamily: family || undefined,
        fontSize: size || undefined,
        fontWeight: weight || undefined,
        lineHeight: height || undefined,
      });
    }
  };

  const weights = [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "normal",
    "bold",
  ];

  return (
    <div className="typography-editor">
      <div className="row g-2">
        <div className="col-12">
          <label className="form-label small mb-1">Font Family</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={fontFamily}
            onChange={(e) =>
              updateTypography(e.target.value, fontSize, fontWeight, lineHeight)
            }
            onBlur={onCommit}
            placeholder="Inter, sans-serif"
          />
        </div>
        <div className="col-6">
          <label className="form-label small mb-1">Font Size</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={fontSize}
            onChange={(e) =>
              updateTypography(
                fontFamily,
                e.target.value,
                fontWeight,
                lineHeight
              )
            }
            onBlur={onCommit}
            placeholder="16px"
          />
        </div>
        <div className="col-6">
          <label className="form-label small mb-1">Font Weight</label>
          <select
            className="form-select form-select-sm"
            value={fontWeight}
            onChange={(e) =>
              updateTypography(fontFamily, fontSize, e.target.value, lineHeight)
            }
            onBlur={onCommit}
          >
            <option value="">Select...</option>
            {weights.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12">
          <label className="form-label small mb-1">Line Height</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={lineHeight}
            onChange={(e) =>
              updateTypography(fontFamily, fontSize, fontWeight, e.target.value)
            }
            onBlur={onCommit}
            placeholder="1.5"
          />
        </div>
      </div>
      <div className="mt-2">
        <div className="small text-muted">Preview:</div>
        <div
          style={{
            fontFamily: fontFamily || "inherit",
            fontSize: fontSize || "16px",
            fontWeight: fontWeight || "normal",
            lineHeight: lineHeight || "1.5",
            padding: "8px",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            backgroundColor: "#f8f9fa",
          }}
        >
          The quick brown fox jumps over the lazy dog
        </div>
      </div>
    </div>
  );
}


