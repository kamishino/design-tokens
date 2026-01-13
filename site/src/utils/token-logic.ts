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
  type: "missing-value" | "missing-type" | "broken-reference" | "circular-reference" | "invalid-format";
}

export interface ValidationWarning {
  path: string;
  message: string;
  type: "missing-description" | "inconsistent-naming";
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
 * Get token categories from all tokens
 */
export function getTokenCategories(allTokens: Record<string, TokenContent>): string[] {
  const categories = new Set<string>(["all"]);
  const flatTokens = getAllTokensFlattened(allTokens);

  for (const { token } of flatTokens) {
    const type = (token.$type || token.type || "other").toLowerCase();
    categories.add(type);
  }

  return Array.from(categories).sort();
}

/**
 * Search tokens by query (fuzzy search on path and description)
 */
export function searchTokens(allTokens: Record<string, TokenContent>, query: string): Array<{ path: string; token: TokenValue; fileName: string }> {
  if (!query.trim()) {
    return getAllTokensFlattened(allTokens);
  }

  const flatTokens = getAllTokensFlattened(allTokens);
  const lowerQuery = query.toLowerCase();

  return flatTokens.filter(({ path, token }) => {
    const description = (token.$description || token.description || "").toLowerCase();
    const pathLower = path.toLowerCase();
    const value = String(token.$value || token.value || "").toLowerCase();

    return pathLower.includes(lowerQuery) || description.includes(lowerQuery) || value.includes(lowerQuery);
  });
}
