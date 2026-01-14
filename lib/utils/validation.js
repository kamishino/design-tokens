/**
 * Token Validation Utilities
 * PRD 0052: Automated validation for naming, type safety, and alias integrity
 */

import { parse as parseColor, formatHex } from "culori";
import { analyzeContrast } from "./apca.js";

// ============================================================================
// NAMING VALIDATION
// ============================================================================

/**
 * Check if a string is valid kebab-case
 * @param {string} str - String to validate
 * @returns {boolean}
 */
export function isValidKebabCase(str) {
  // Must be lowercase, alphanumeric with hyphens, no consecutive hyphens
  const kebabRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return kebabRegex.test(str);
}

/**
 * Validate token path structure and naming convention
 * @param {string} tokenPath - Token path (e.g., "color.primary.500")
 * @returns {object} Validation result
 */
export function validateTokenPath(tokenPath) {
  if (!tokenPath || typeof tokenPath !== "string") {
    return {
      valid: false,
      error: "Token path is required and must be a string",
    };
  }
  
  const parts = tokenPath.split(".");
  
  if (parts.length < 2) {
    return {
      valid: false,
      error: "Token path must have at least 2 segments (e.g., 'color.primary')",
    };
  }
  
  for (const part of parts) {
    if (!isValidKebabCase(part)) {
      return {
        valid: false,
        error: `Invalid segment "${part}". Use kebab-case (lowercase with hyphens)`,
        suggestion: part.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };
    }
  }
  
  return { valid: true };
}

// ============================================================================
// TYPE VALIDATION
// ============================================================================

/**
 * Validate token value against its type
 * @param {string} tokenType - Token type (color, dimension, etc.)
 * @param {any} value - Token value
 * @returns {object} Validation result
 */
export function validateTypeAndValue(tokenType, value) {
  if (!tokenType) {
    return { valid: false, error: "Token type is required" };
  }
  
  switch (tokenType) {
    case "color":
      return validateColorValue(value);
    case "dimension":
      return validateDimensionValue(value);
    case "fontFamily":
      return validateFontFamilyValue(value);
    case "fontWeight":
      return validateFontWeightValue(value);
    case "duration":
      return validateDurationValue(value);
    case "cubicBezier":
      return validateCubicBezierValue(value);
    case "number":
      return validateNumberValue(value);
    case "string":
      return { valid: true }; // Strings are always valid
    default:
      return { valid: true, warning: `Unknown type "${tokenType}" - validation skipped` };
  }
}

function validateColorValue(value) {
  if (typeof value !== "string") {
    return { valid: false, error: "Color value must be a string" };
  }
  
  // Check if it's an alias reference
  if (value.startsWith("{") && value.endsWith("}")) {
    return { valid: true, isAlias: true };
  }
  
  // Try to parse as color
  const parsed = parseColor(value);
  if (!parsed) {
    return {
      valid: false,
      error: "Invalid color format. Use hex (#FF0000), rgb(), hsl(), or CSS named colors",
    };
  }
  
  return { valid: true };
}

function validateDimensionValue(value) {
  if (typeof value !== "string") {
    return { valid: false, error: "Dimension value must be a string" };
  }
  
  if (value.startsWith("{") && value.endsWith("}")) {
    return { valid: true, isAlias: true };
  }
  
  // Valid units: px, rem, em, %, vh, vw, vmin, vmax
  const dimensionRegex = /^-?\d+(\.\d+)?(px|rem|em|%|vh|vw|vmin|vmax)$/;
  if (!dimensionRegex.test(value)) {
    return {
      valid: false,
      error: "Invalid dimension format. Use number with unit (e.g., 16px, 1.5rem, 50%)",
    };
  }
  
  return { valid: true };
}

function validateFontFamilyValue(value) {
  if (typeof value !== "string" && !Array.isArray(value)) {
    return { valid: false, error: "Font family must be a string or array of strings" };
  }
  
  return { valid: true };
}

function validateFontWeightValue(value) {
  if (typeof value === "number") {
    if (value < 1 || value > 1000) {
      return { valid: false, error: "Font weight must be between 1 and 1000" };
    }
    return { valid: true };
  }
  
  if (typeof value === "string") {
    const validKeywords = ["normal", "bold", "lighter", "bolder"];
    if (validKeywords.includes(value) || value.startsWith("{")) {
      return { valid: true };
    }
  }
  
  return { valid: false, error: "Font weight must be a number (1-1000) or keyword" };
}

function validateDurationValue(value) {
  if (typeof value !== "string") {
    return { valid: false, error: "Duration value must be a string" };
  }
  
  if (value.startsWith("{") && value.endsWith("}")) {
    return { valid: true, isAlias: true };
  }
  
  const durationRegex = /^\d+(\.\d+)?(ms|s)$/;
  if (!durationRegex.test(value)) {
    return { valid: false, error: "Invalid duration format. Use number with ms or s (e.g., 200ms, 0.3s)" };
  }
  
  return { valid: true };
}

function validateCubicBezierValue(value) {
  if (!Array.isArray(value) || value.length !== 4) {
    return { valid: false, error: "Cubic bezier must be an array of 4 numbers" };
  }
  
  if (!value.every(n => typeof n === "number" && n >= 0 && n <= 1)) {
    return { valid: false, error: "Cubic bezier values must be numbers between 0 and 1" };
  }
  
  return { valid: true };
}

function validateNumberValue(value) {
  if (typeof value !== "number") {
    return { valid: false, error: "Value must be a number" };
  }
  
  return { valid: true };
}

// ============================================================================
// ALIAS INTEGRITY
// ============================================================================

/**
 * Extract alias reference from a value
 * @param {any} value - Token value that might contain alias
 * @returns {string|null} Alias path or null
 */
export function extractAlias(value) {
  if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
    return value.slice(1, -1);
  }
  return null;
}

/**
 * Check if alias reference exists in token set
 * @param {string} aliasPath - Alias path to check
 * @param {object} tokenSet - Complete token set (flat or nested)
 * @returns {object} Validation result
 */
export function checkAliasIntegrity(aliasPath, tokenSet) {
  if (!aliasPath) {
    return { valid: true };
  }
  
  // For flat token set (array of tokens)
  if (Array.isArray(tokenSet)) {
    const exists = tokenSet.some(token => token.token_path === aliasPath);
    if (!exists) {
      return {
        valid: false,
        error: `Alias reference "{${aliasPath}}" not found`,
        suggestion: "Check that the referenced token exists",
      };
    }
    return { valid: true };
  }
  
  // For nested token set (object tree)
  const parts = aliasPath.split(".");
  let current = tokenSet;
  
  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return {
        valid: false,
        error: `Alias reference "{${aliasPath}}" not found`,
      };
    }
    current = current[part];
  }
  
  if (current === undefined) {
    return {
      valid: false,
      error: `Alias reference "{${aliasPath}}" not found`,
    };
  }
  
  return { valid: true };
}

/**
 * Detect circular dependencies in alias chain
 * @param {string} startPath - Starting token path
 * @param {object} tokenSet - Token set (array)
 * @returns {object} Validation result
 */
export function detectCircularDependency(startPath, tokenSet) {
  const visited = new Set();
  const chain = [];
  
  function traverse(path) {
    if (visited.has(path)) {
      return {
        valid: false,
        error: `Circular dependency detected: ${chain.join(" → ")} → ${path}`,
        chain: [...chain, path],
      };
    }
    
    visited.add(path);
    chain.push(path);
    
    const token = tokenSet.find(t => t.token_path === path);
    if (!token) {
      return { valid: true }; // Token not found, but not a circular issue
    }
    
    const alias = extractAlias(token.value);
    if (alias) {
      return traverse(alias);
    }
    
    return { valid: true };
  }
  
  return traverse(startPath);
}

// ============================================================================
// CONTRAST VALIDATION
// ============================================================================

/**
 * Validate color contrast for accessibility
 * @param {string} textColor - Text color
 * @param {string} backgroundColor - Background color
 * @param {object} options - Validation options
 * @returns {object} Validation result with WCAG 2.1 and APCA analysis
 */
export function validateContrast(textColor, backgroundColor, options = {}) {
  const {
    textSize = "normal",
    requireWCAG21 = true,
    requireAPCA = false,
    wcag21Level = "AA",
    apcaMinimum = 60,
  } = options;
  
  try {
    const analysis = analyzeContrast(textColor, backgroundColor, textSize);
    
    if (analysis.error) {
      return {
        valid: false,
        error: analysis.error,
      };
    }
    
    const warnings = [];
    const failures = [];
    
    // Check WCAG 2.1
    if (requireWCAG21) {
      const wcag21Pass = analysis.wcag21.compliance.level === wcag21Level || 
                          analysis.wcag21.compliance.level === "AAA";
      if (!wcag21Pass) {
        failures.push(`WCAG 2.1: Does not meet ${wcag21Level} (ratio: ${analysis.wcag21.ratio.toFixed(2)}:1)`);
      }
    }
    
    // Check APCA
    if (requireAPCA) {
      const apcaPass = Math.abs(analysis.apca.value) >= apcaMinimum;
      if (!apcaPass) {
        warnings.push(`APCA: Below recommended minimum (${Math.abs(analysis.apca.value).toFixed(1)} < ${apcaMinimum})`);
      }
    }
    
    return {
      valid: failures.length === 0,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: failures.length > 0 ? failures : undefined,
      analysis,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Validate a complete token object
 * @param {object} token - Token object with path, type, value, etc.
 * @param {object} tokenSet - Complete token set for alias checking
 * @param {object} options - Validation options
 * @returns {object} Comprehensive validation result
 */
export function validateToken(token, tokenSet = [], options = {}) {
  const errors = [];
  const warnings = [];
  
  // 1. Validate path
  const pathResult = validateTokenPath(token.token_path || token.path);
  if (!pathResult.valid) {
    errors.push({ field: "path", ...pathResult });
  }
  
  // 2. Validate type and value
  const typeResult = validateTypeAndValue(token.token_type || token.type, token.value);
  if (!typeResult.valid) {
    errors.push({ field: "value", ...typeResult });
  } else if (typeResult.warning) {
    warnings.push({ field: "type", message: typeResult.warning });
  }
  
  // 3. Check alias integrity
  const alias = extractAlias(token.value);
  if (alias) {
    const aliasResult = checkAliasIntegrity(alias, tokenSet);
    if (!aliasResult.valid) {
      errors.push({ field: "value", ...aliasResult });
    }
    
    // Check circular dependency
    if (Array.isArray(tokenSet)) {
      const circularResult = detectCircularDependency(token.token_path || token.path, tokenSet);
      if (!circularResult.valid) {
        errors.push({ field: "value", ...circularResult });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export default {
  isValidKebabCase,
  validateTokenPath,
  validateTypeAndValue,
  extractAlias,
  checkAliasIntegrity,
  detectCircularDependency,
  validateContrast,
  validateToken,
};
