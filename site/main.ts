/**
 * Design Tokens Preview Site - Client-Side Rendering
 * Fetches token data and dynamically renders the documentation
 */

interface Token {
  $value?: any;
  $type?: string;
  [key: string]: any;
}

interface TokenData {
  [key: string]: Token | any;
}

// Set timestamp
document.addEventListener("DOMContentLoaded", () => {
  const timestampEl = document.getElementById("timestamp");
  if (timestampEl) {
    timestampEl.textContent = new Date().toISOString();
  }
});

// Fetch and render tokens
async function initializeApp() {
  const appContainer = document.getElementById("app");
  if (!appContainer) return;

  try {
    // Fetch token data using BASE_URL for correct path resolution
    const response = await fetch(`${import.meta.env.BASE_URL}json/tokens.json`);
    if (!response.ok) {
      throw new Error(`Failed to load tokens: ${response.statusText}`);
    }

    const tokens: TokenData = await response.json();

    // Clear loading state
    appContainer.innerHTML = "";

    // Render sections
    renderColors(tokens, appContainer);
    renderTypography(tokens, appContainer);
    renderSpacing(tokens, appContainer);
    renderComponents(tokens, appContainer);
  } catch (error) {
    appContainer.innerHTML = `
      <div class="error" style="color: red; padding: 2rem; text-align: center;">
        <h2>Error Loading Tokens</h2>
        <p>${error instanceof Error ? error.message : "Unknown error"}</p>
        <p style="margin-top: 1rem; font-size: 0.875rem;">
          Make sure to run <code>npm run build:tokens</code> first to generate the token files.
        </p>
      </div>
    `;
  }
}

// Render color swatches
function renderColors(tokens: TokenData, container: HTMLElement) {
  const section = document.createElement("section");
  section.className = "section";
  section.innerHTML = "<h2>Colors</h2>";

  // Primitives
  if (tokens.color) {
    const primitivesSection = document.createElement("div");
    primitivesSection.innerHTML = "<h3>Primitives</h3>";

    const grid = document.createElement("div");
    grid.className = "color-grid";

    const primitiveColors = flattenObject(tokens.color, "color");
    for (const [name, value] of Object.entries(primitiveColors)) {
      const card = createColorCard(name, value);
      grid.appendChild(card);
    }

    primitivesSection.appendChild(grid);
    section.appendChild(primitivesSection);
  }

  container.appendChild(section);
}

// Create color card element
function createColorCard(name: string, value: any): HTMLElement {
  const displayValue = typeof value === "object" ? value.$value : value;
  const varName = `--${name.replace(/\./g, "-")}`;

  const card = document.createElement("div");
  card.className = "color-card";

  // Determine if it's a reference or actual value
  const isReference = typeof displayValue === "string" && displayValue.startsWith("{");
  const backgroundColor = isReference ? `var(${varName})` : displayValue;

  card.innerHTML = `
    <div class="color-swatch" style="background-color: ${backgroundColor};"></div>
    <div class="color-info">
      <div class="color-name">${name}</div>
      <div class="color-value">${displayValue}</div>
      <div class="color-value" style="margin-top: 0.25rem;">${varName}</div>
    </div>
  `;

  return card;
}

// Render typography specimens
function renderTypography(tokens: TokenData, container: HTMLElement) {
  if (!tokens.fontSize && !tokens.fontWeight) return;

  const section = document.createElement("section");
  section.className = "section";
  section.innerHTML = "<h2>Typography</h2>";

  // Font Sizes
  if (tokens.fontSize) {
    const sizesSection = document.createElement("div");
    sizesSection.innerHTML = "<h3>Font Sizes</h3>";

    for (const [key, value] of Object.entries(tokens.fontSize)) {
      const size = typeof value === "object" ? (value as Token).$value : value;
      const specimen = document.createElement("div");
      specimen.className = "type-specimen";
      specimen.innerHTML = `
        <div class="type-label">fontSize-${key} (${size})</div>
        <div style="font-size: var(--fontSize-${key});">
          The quick brown fox jumps over the lazy dog
        </div>
      `;
      sizesSection.appendChild(specimen);
    }

    section.appendChild(sizesSection);
  }

  // Font Weights
  if (tokens.fontWeight) {
    const weightsSection = document.createElement("div");
    weightsSection.innerHTML = "<h3>Font Weights</h3>";

    for (const [key, value] of Object.entries(tokens.fontWeight)) {
      const weight = typeof value === "object" ? (value as Token).$value : value;
      const specimen = document.createElement("div");
      specimen.className = "type-specimen";
      specimen.innerHTML = `
        <div class="type-label">fontWeight-${key} (${weight})</div>
        <div style="font-weight: var(--fontWeight-${key}); font-size: 1.25rem;">
          The quick brown fox jumps over the lazy dog
        </div>
      `;
      weightsSection.appendChild(specimen);
    }

    section.appendChild(weightsSection);
  }

  container.appendChild(section);
}

// Render spacing visualizations
function renderSpacing(tokens: TokenData, container: HTMLElement) {
  if (!tokens.spacing) return;

  const section = document.createElement("section");
  section.className = "section";
  section.innerHTML = "<h2>Spacing</h2>";

  const grid = document.createElement("div");
  grid.className = "spacing-grid";

  for (const [key, value] of Object.entries(tokens.spacing)) {
    const size = typeof value === "object" ? (value as Token).$value : value;

    const item = document.createElement("div");
    item.className = "spacing-item";
    item.innerHTML = `
      <div class="spacing-label">spacing-${key}</div>
      <div class="spacing-visual" style="width: var(--spacing-${key});"></div>
      <div class="spacing-value">${size}</div>
    `;

    grid.appendChild(item);
  }

  section.appendChild(grid);
  container.appendChild(section);
}

// Render component examples
function renderComponents(tokens: TokenData, container: HTMLElement) {
  if (!tokens.button && !tokens.input && !tokens.card) return;

  const section = document.createElement("section");
  section.className = "section";
  section.innerHTML = "<h2>Component Examples</h2>";

  const grid = document.createElement("div");
  grid.className = "component-grid";

  // Button example
  if (tokens.button) {
    const demo = document.createElement("div");
    demo.className = "component-demo";
    demo.innerHTML = `
      <h3>Button</h3>
      <button class="demo-button">Primary Button</button>
      <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-text-secondary);">
        Uses button tokens: padding, border-radius, font-size, font-weight
      </div>
    `;
    grid.appendChild(demo);
  }

  // Input example
  if (tokens.input) {
    const demo = document.createElement("div");
    demo.className = "component-demo";
    demo.innerHTML = `
      <h3>Input</h3>
      <input type="text" class="demo-input" placeholder="Enter text...">
      <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-text-secondary);">
        Uses input tokens: padding, border-radius, border-width, font-size
      </div>
    `;
    grid.appendChild(demo);
  }

  // Card example
  if (tokens.card) {
    const demo = document.createElement("div");
    demo.className = "component-demo";
    demo.innerHTML = `
      <h3>Card</h3>
      <div class="demo-card">
        <h4 style="margin-bottom: 0.5rem;">Card Title</h4>
        <p>This card demonstrates the card tokens including padding, border-radius, and shadow.</p>
      </div>
    `;
    grid.appendChild(demo);
  }

  section.appendChild(grid);
  container.appendChild(section);
}

// Utility: Flatten nested object
function flattenObject(obj: any, prefix = ""): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null) {
      if ((value as any).$value !== undefined) {
        result[currentPath] = (value as any).$value;
      } else if ((value as any).value !== undefined) {
        result[currentPath] = (value as any).value;
      } else {
        Object.assign(result, flattenObject(value, currentPath));
      }
    } else {
      result[currentPath] = value;
    }
  }

  return result;
}

// Initialize the app
initializeApp();
