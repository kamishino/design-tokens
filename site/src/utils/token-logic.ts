/**
 * Token Logic Utilities
 * Handles token resolution, validation, and reference management
 */

import { TokenContent, TokenValue } from "../types";

export interface ResolvedToken {
  value: any;
  resolvedValue: any;
  isReference: boolean;
  referencePath?: string;
  isValid: boolean;
  error?: string;
  type?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  type:
    | "missing-value"
    | "missing-type"
    | "broken-reference"
    | "circular-reference"
    | "invalid-format"
    | "invalid-color";
}

export interface ValidationWarning {
  path: string;
  message: string;
  type: "missing-description" | "inconsistent-naming";
}

/**
 * Check if a value is a valid HEX color code
 * Supports: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 */
export function isHexColor(value: string): boolean {
  if (typeof value !== "string") return false;
  return /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(
    value.trim()
  );
}

/**
 * Validate if a color value is valid
 * For now, only supports HEX colors strictly
 */
export function isValidColor(value: any): boolean {
  if (typeof value !== "string") return false;
  return isHexColor(value);
}

/**
 * Normalize HEX color to uppercase with # prefix
 */
export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("#")) {
    return "#" + trimmed.toUpperCase();
  }
  return trimmed.toUpperCase();
}

/**
 * Check if a value is a token reference (e.g., "{color.blue.500}")
 */
export function isTokenReference(value: any): boolean {
  if (typeof value !== "string") return false;
  return /^\{[^}]+\}$/.test(value.trim());
}

/**
 * Extract the path from a token reference
 * E.g., "{color.blue.500}" -> "color.blue.500"
 */
export function extractReferencePath(value: string): string {
  const match = value.match(/^\{([^}]+)\}$/);
  return match ? match[1] : "";
}

/**
 * Get a token by its dot-notation path from all token content
 */
export function getTokenByPath(path: string, allTokens: Record<string, TokenContent>): TokenValue | null {
  const parts = path.split(".");

  for (const [fileName, content] of Object.entries(allTokens)) {
    let current: any = content;
    let found = true;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        found = false;
        break;
      }
    }

    if (found && isTokenValue(current)) {
      return current;
    }
  }

  return null;
}

/**
 * Recursively resolve a token reference to its final value
 * Detects circular references
 */
export function resolveToken(token: TokenValue, allTokens: Record<string, TokenContent>, visited: Set<string> = new Set()): ResolvedToken {
  const value = token.$value || token.value;
  const type = token.$type;

  // Not a reference, return as-is
  if (!isTokenReference(value)) {
    return {
      value,
      resolvedValue: value,
      isReference: false,
      isValid: true,
      type,
    };
  }

  // It's a reference
  const referencePath = extractReferencePath(value);

  // Check for circular reference
  if (visited.has(referencePath)) {
    return {
      value,
      resolvedValue: null,
      isReference: true,
      referencePath,
      isValid: false,
      error: `Circular reference detected: ${Array.from(visited).join(" -> ")} -> ${referencePath}`,
      type,
    };
  }

  // Try to resolve the reference
  const referencedToken = getTokenByPath(referencePath, allTokens);

  if (!referencedToken) {
    return {
      value,
      resolvedValue: null,
      isReference: true,
      referencePath,
      isValid: false,
      error: `Reference not found: ${referencePath}`,
      type,
    };
  }

  // Recursively resolve
  visited.add(referencePath);
  const resolved = resolveToken(referencedToken, allTokens, visited);

  return {
    value,
    resolvedValue: resolved.resolvedValue,
    isReference: true,
    referencePath,
    isValid: resolved.isValid,
    error: resolved.error,
    type: type || resolved.type,
  };
}

/**
 * Get all tokens flattened as a list with their paths
 */
export function getAllTokensFlattened(allTokens: Record<string, TokenContent>): Array<{ path: string; token: TokenValue; fileName: string }> {
  const result: Array<{ path: string; token: TokenValue; fileName: string }> = [];

  function traverse(obj: any, currentPath: string[], fileName: string) {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...currentPath, key];

      if (isTokenValue(value)) {
        result.push({
          path: newPath.join("."),
          token: value as TokenValue,
          fileName,
        });
      } else if (typeof value === "object" && value !== null) {
        traverse(value, newPath, fileName);
      }
    }
  }

  for (const [fileName, content] of Object.entries(allTokens)) {
    traverse(content, [], fileName);
  }

  return result;
}

/**
 * Validate token structure for W3C compliance
 */
export function validateTokenStructure(allTokens: Record<string, TokenContent>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  function validateToken(path: string, token: any) {
    // Check for $value or value
    if (!token.$value && !token.value) {
      errors.push({
        path,
        message: "Token must have $value or value property",
        type: "missing-value",
      });
    }

    // Check for $type (warning if missing)
    if (!token.$type && !token.type) {
      warnings.push({
        path,
        message: "Token should have a $type property for better validation",
        type: "missing-description",
      });
    }

    // Check if reference is valid
    const value = token.$value || token.value;
    if (isTokenReference(value)) {
      const resolved = resolveToken(token, allTokens);
      if (!resolved.isValid) {
        errors.push({
          path,
          message: resolved.error || "Invalid reference",
          type: "broken-reference",
        });
      }
    }

    // Check for description (warning)
    if (!token.$description && !token.description) {
      warnings.push({
        path,
        message: "Consider adding a description for better documentation",
        type: "missing-description",
      });
    }
  }

  const flatTokens = getAllTokensFlattened(allTokens);
  for (const { path, token } of flatTokens) {
    validateToken(path, token);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Filter tokens by category/type
 */
export function filterTokensByType(
  allTokens: Record<string, TokenContent>,
  type: string
): Array<{ path: string; token: TokenValue; fileName: string }> {
  const flatTokens = getAllTokensFlattened(allTokens);

  if (type === "all") return flatTokens;

  return flatTokens.filter((item) => {
    const tokenType = (item.token.$type || item.token.type || "").toLowerCase();
    return tokenType === type.toLowerCase();
  });
}

/**
 * Check if an object is a token value
 */
function isTokenValue(obj: any): obj is TokenValue {
  return typeof obj === "object" && obj !== null && (obj.$value !== undefined || (obj.value !== undefined && obj.$type !== undefined));
}

/**
 * Extract category from file path (folder-based)
 * E.g., "tokens/primitives/colors.json" -> "primitives"
 */
export function getCategoryFromPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  
  // Find the folder name after 'tokens'
  const tokensIndex = parts.indexOf("tokens");
  if (tokensIndex >= 0 && tokensIndex < parts.length - 1) {
    return parts[tokensIndex + 1].toLowerCase();
  }
  
  // Fallback: use the first folder in the path
  return parts.length > 1 ? parts[0].toLowerCase() : "other";
}

/**
 * Get token categories from all tokens (folder-based)
 */
export function getTokenCategories(
  allTokens: Record<string, TokenContent>
): string[] {
  const categories = new Set<string>(["all"]);

  for (const filePath of Object.keys(allTokens)) {
    const category = getCategoryFromPath(filePath);
    categories.add(category);
  }

  return Array.from(categories).sort();
}

/**
 * Filter tokens by category (folder-based)
 */
export function filterTokensByCategory(
  allTokens: Record<string, TokenContent>,
  category: string
): Array<{ path: string; token: TokenValue; fileName: string }> {
  if (category === "all") {
    return getAllTokensFlattened(allTokens);
  }

  const flatTokens = getAllTokensFlattened(allTokens);
  const categoryLower = category.toLowerCase();

  return flatTokens.filter(({ fileName }) => {
    const fileCategory = getCategoryFromPath(fileName);
    return fileCategory === categoryLower;
  });
}

/**
 * Search tokens by query (case-insensitive search on path, value, and description)
 */
export function searchTokens(
  allTokens: Record<string, TokenContent>,
  query: string
): Array<{ path: string; token: TokenValue; fileName: string }> {
  if (!query.trim()) {
    return getAllTokensFlattened(allTokens);
  }

  const flatTokens = getAllTokensFlattened(allTokens);
  const lowerQuery = query.toLowerCase().trim();

  return flatTokens.filter(({ path, token }) => {
    const description = (
      token.$description ||
      token.description ||
      ""
    ).toLowerCase();
    const pathLower = path.toLowerCase();
    const value = String(token.$value || token.value || "").toLowerCase();

    return (
      pathLower.includes(lowerQuery) ||
      description.includes(lowerQuery) ||
      value.includes(lowerQuery)
    );
  });
}

/**
 * Group flat token results by their source file/folder for presentation
 */
export function groupTokensByFile(
  tokens: Array<{ path: string; token: TokenValue; fileName: string }>
): Record<string, Array<{ path: string; token: TokenValue }>> {
  const grouped: Record<
    string,
    Array<{ path: string; token: TokenValue }>
  > = {};

  for (const { path, token, fileName } of tokens) {
    if (!grouped[fileName]) {
      grouped[fileName] = [];
    }
    grouped[fileName].push({ path, token });
  }

  return grouped;
}

/**
 * Calculate token counts per category for badge display
 */
export function getTokenCountsByCategory(
  tokens: Array<{ path: string; token: TokenValue; fileName: string }>
): Record<string, number> {
  const counts: Record<string, number> = { all: tokens.length };

  for (const { fileName } of tokens) {
    const category = getCategoryFromPath(fileName);
    counts[category] = (counts[category] || 0) + 1;
  }

  return counts;
}

/**
 * Build a usage map showing which tokens reference which other tokens
 * Returns: { "color.blue.500": ["button.primary.bg", "link.color"] }
 */
export function buildUsageMap(allTokens: Record<string, TokenContent>): Record<string, string[]> {
  const usageMap: Record<string, string[]> = {};
  const flatTokens = getAllTokensFlattened(allTokens);

  for (const { path, token } of flatTokens) {
    const value = token.$value || token.value;
    if (isTokenReference(value)) {
      const referencePath = extractReferencePath(value);
      if (!usageMap[referencePath]) {
        usageMap[referencePath] = [];
      }
      usageMap[referencePath].push(path);
    }
  }

  return usageMap;
}

/**
 * Get the number of tokens that reference a specific token path
 */
export function getTokenUsageCount(tokenPath: string, allTokens: Record<string, TokenContent>): number {
  const usageMap = buildUsageMap(allTokens);
  return (usageMap[tokenPath] || []).length;
}

/**
 * Find all tokens matching a value (supports regex)
 */
export function findTokensByValue(
  allTokens: Record<string, TokenContent>,
  searchValue: string,
  useRegex: boolean = false
): Array<{ path: string; token: TokenValue; fileName: string; currentValue: any }> {
  const flatTokens = getAllTokensFlattened(allTokens);
  const results: Array<{ path: string; token: TokenValue; fileName: string; currentValue: any }> = [];

  for (const { path, token, fileName } of flatTokens) {
    const value = String(token.$value || token.value || "");
    let matches = false;

    if (useRegex) {
      try {
        const regex = new RegExp(searchValue, "i");
        matches = regex.test(value);
      } catch (e) {
        // Invalid regex, fall back to literal
        matches = value.toLowerCase().includes(searchValue.toLowerCase());
      }
    } else {
      matches = value.toLowerCase() === searchValue.toLowerCase();
    }

    if (matches) {
      results.push({ path, token, fileName, currentValue: value });
    }
  }

  return results;
}

/**
 * Replace a value across all tokens
 * Returns updated token content and count of replacements
 */
export function findAndReplaceValue(
  allTokens: Record<string, TokenContent>,
  findValue: string,
  replaceValue: string,
  useRegex: boolean = false
): { updatedTokens: Record<string, TokenContent>; replacementCount: number } {
  const updatedTokens: Record<string, TokenContent> = {};
  let replacementCount = 0;

  for (const [fileName, content] of Object.entries(allTokens)) {
    const updatedContent = JSON.parse(JSON.stringify(content)); // Deep clone
    
    const replaceInObject = (obj: any): void => {
      for (const key in obj) {
        if (isTokenValue(obj[key])) {
          const token = obj[key];
          const valueKey = token.$value !== undefined ? "$value" : "value";
          const currentValue = String(token[valueKey] || "");

          let newValue = currentValue;
          if (useRegex) {
            try {
              const regex = new RegExp(findValue, "gi");
              if (regex.test(currentValue)) {
                newValue = currentValue.replace(regex, replaceValue);
                replacementCount++;
              }
            } catch (e) {
              // Invalid regex
            }
          } else {
            if (currentValue.toLowerCase() === findValue.toLowerCase()) {
              newValue = replaceValue;
              replacementCount++;
            }
          }

          if (newValue !== currentValue) {
            token[valueKey] = newValue;
          }
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          replaceInObject(obj[key]);
        }
      }
    };

    replaceInObject(updatedContent);
    updatedTokens[fileName] = updatedContent;
  }

  return { updatedTokens, replacementCount };
}

/**
 * Find the file and path for a token reference
 * Used for click-to-navigate functionality
 */
export function findTokenLocation(
  tokenPath: string,
  allTokens: Record<string, TokenContent>
): { fileName: string; path: string[] } | null {
  const flatTokens = getAllTokensFlattened(allTokens);
  
  for (const { path, fileName } of flatTokens) {
    if (path === tokenPath) {
      return { fileName, path: path.split(".") };
    }
  }

  return null;
}
