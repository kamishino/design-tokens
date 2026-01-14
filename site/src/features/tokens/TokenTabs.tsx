/**
 * TokenTabs Component
 * Category-based navigation tabs for token types
 */

import { Icons } from "@shared/components/Icons";

interface TokenTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  tokenCounts?: Record<string, number>;
}

// Icon mapping for token categories
const categoryIcons: Record<string, string> = {
  all: Icons.FILES,
  color: Icons.COLOR,
  typography: Icons.TYPOGRAPHY,
  fontfamily: Icons.TYPOGRAPHY,
  fontsize: Icons.TYPOGRAPHY,
  fontweight: Icons.TYPOGRAPHY,
  spacing: Icons.SPACING,
  dimension: Icons.SPACING,
  sizing: Icons.SPACING,
  borderradius: Icons.BORDER,
  border: Icons.BORDER,
  shadow: Icons.SHADOW,
  boxshadow: Icons.SHADOW,
};

// Human-readable category names
const categoryLabels: Record<string, string> = {
  all: "All Tokens",
  color: "Colors",
  typography: "Typography",
  fontfamily: "Font Family",
  fontsize: "Font Size",
  fontweight: "Font Weight",
  spacing: "Spacing",
  dimension: "Dimensions",
  sizing: "Sizing",
  borderradius: "Border Radius",
  border: "Borders",
  shadow: "Shadows",
  boxshadow: "Box Shadow",
};

export default function TokenTabs({ categories, activeCategory, onCategoryChange, tokenCounts = {} }: TokenTabsProps) {
  return (
    <div className="card mb-3">
      <div className="card-header">
        <ul className="nav nav-tabs card-header-tabs" role="tablist">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            const icon = categoryIcons[category] || Icons.FILES;
            const label = categoryLabels[category] || capitalize(category);
            const count = tokenCounts[category] || 0;

            return (
              <li className="nav-item" key={category} role="presentation">
                <button
                  className={`nav-link ${isActive ? "active" : ""}`}
                  onClick={() => onCategoryChange(category)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                >
                  <i className={icon + " me-1"}></i>
                  {label}
                  {count > 0 && <span className="badge bg-blue-lt ms-2">{count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

