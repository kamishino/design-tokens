import Select, { StylesConfig } from "react-select";

interface TokenTypeOption {
  readonly value: string;
  readonly label: string;
}

interface TokenTypeGroup {
  readonly label: string;
  readonly options: readonly TokenTypeOption[];
}

// Grouped token types with FTS and W3C DTCG dual compatibility
const tokenTypeGroups: TokenTypeGroup[] = [
  {
    label: "Core Types",
    options: [
      { value: "color", label: "Color" },
      { value: "dimension", label: "Dimension" },
      { value: "number", label: "Number" },
      { value: "string", label: "String" },
    ],
  },
  {
    label: "Typography (FTS - Independent)",
    options: [
      { value: "fontFamilies", label: "Font Families" },
      { value: "fontSizes", label: "Font Sizes" },
      { value: "fontWeights", label: "Font Weights" },
      { value: "lineHeights", label: "Line Heights" },
    ],
  },
  {
    label: "Typography (W3C DTCG - Composite)",
    options: [
      { value: "fontFamily", label: "Font Family" },
      { value: "fontSize", label: "Font Size" },
      { value: "fontWeight", label: "Font Weight" },
      { value: "lineHeight", label: "Line Height" },
    ],
  },
  {
    label: "Advanced & Composite",
    options: [
      { value: "typography", label: "Typography" },
      { value: "shadow", label: "Shadow" },
      { value: "gradient", label: "Gradient" },
      { value: "border", label: "Border" },
      { value: "transition", label: "Transition" },
      { value: "strokeStyle", label: "Stroke Style" },
    ],
  },
  {
    label: "Animation",
    options: [
      { value: "duration", label: "Duration" },
      { value: "cubicBezier", label: "Cubic Bezier" },
    ],
  },
];

// Custom styles to match Tabler UI
const customStyles: StylesConfig<TokenTypeOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    backgroundColor: "var(--tblr-body-bg, #fff)",
    borderColor: state.isFocused
      ? "var(--tblr-primary, #206bc4)"
      : "var(--tblr-border-color, #d9dbde)",
    borderRadius: "4px",
    boxShadow: state.isFocused
      ? "0 0 0 0.25rem rgba(32, 107, 196, 0.25)"
      : "none",
    fontSize: "0.875rem",
    "&:hover": {
      borderColor: state.isFocused
        ? "var(--tblr-primary, #206bc4)"
        : "var(--tblr-border-color-translucent, rgba(4, 32, 69, 0.14))",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--tblr-body-bg, #fff)",
    border: "1px solid var(--tblr-border-color, #d9dbde)",
    borderRadius: "4px",
    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
    zIndex: 1060,
    fontSize: "0.875rem",
  }),
  menuList: (base) => ({
    ...base,
    padding: "0.5rem 0",
  }),
  option: (base, { isDisabled, isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isDisabled
      ? undefined
      : isSelected
      ? "var(--tblr-primary, #206bc4)"
      : isFocused
      ? "var(--tblr-active-bg, rgba(32, 107, 196, 0.06))"
      : undefined,
    color: isDisabled
      ? "var(--tblr-muted, #667382)"
      : isSelected
      ? "#fff"
      : "var(--tblr-body-color, #1e293b)",
    cursor: isDisabled ? "not-allowed" : "pointer",
    fontSize: "0.875rem",
    padding: "0.5rem 1rem",
    "&:active": {
      backgroundColor: isSelected
        ? "var(--tblr-primary, #206bc4)"
        : "var(--tblr-active-bg, rgba(32, 107, 196, 0.12))",
    },
  }),
  groupHeading: (base) => ({
    ...base,
    color: "var(--tblr-secondary, #667382)",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "0.5rem 1rem 0.25rem",
    marginBottom: "0.25rem",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--tblr-body-color, #1e293b)",
    fontSize: "0.875rem",
  }),
  input: (base) => ({
    ...base,
    color: "var(--tblr-body-color, #1e293b)",
    fontSize: "0.875rem",
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--tblr-muted, #667382)",
    fontSize: "0.875rem",
  }),
};

interface TokenTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TokenTypeSelect({
  value,
  onChange,
  disabled = false,
}: TokenTypeSelectProps) {
  // Find the selected option from all groups
  const selectedOption = tokenTypeGroups
    .flatMap((group) => group.options)
    .find((option) => option.value === value);

  return (
    <Select<TokenTypeOption, false>
      value={selectedOption || null}
      onChange={(option) => option && onChange(option.value)}
      options={tokenTypeGroups}
      styles={customStyles}
      isSearchable={true}
      isClearable={false}
      isDisabled={disabled}
      placeholder="Select token type..."
      classNamePrefix="token-type-select"
      menuPlacement="auto"
    />
  );
}
