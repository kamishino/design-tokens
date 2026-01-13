/**
 * Diff Logic Utilities
 * Compare token objects and identify changes
 */

import { TokenContent, TokenValue } from "../types";

export type DiffStatus = "added" | "modified" | "removed" | "unchanged";

export interface TokenDiff {
  path: string;
  status: DiffStatus;
  oldValue?: any;
  newValue?: any;
  oldToken?: TokenValue;
  newToken?: TokenValue;
}

/**
 * Flatten a token object into a map of paths to tokens
 */
function flattenTokens(obj: any, prefix: string = ""): Map<string, TokenValue> {
  const result = new Map<string, TokenValue>();

  function traverse(current: any, currentPath: string) {
    if (!current || typeof current !== "object") return;

    // Check if this is a token value
    if (current.$value !== undefined || (current.value !== undefined && current.$type !== undefined)) {
      result.set(currentPath, current as TokenValue);
      return;
    }

    // Traverse nested objects
    for (const [key, value] of Object.entries(current)) {
      if (key.startsWith("$")) continue; // Skip metadata at group level
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      traverse(value, newPath);
    }
  }

  traverse(obj, prefix);
  return result;
}

/**
 * Compare two token objects and return a list of differences
 */
export function diffTokens(oldTokens: Record<string, TokenContent>, newTokens: Record<string, TokenContent>): TokenDiff[] {
  const diffs: TokenDiff[] = [];

  // Flatten both old and new tokens
  const oldFlat = new Map<string, TokenValue>();
  const newFlat = new Map<string, TokenValue>();

  for (const [fileName, content] of Object.entries(oldTokens)) {
    const fileTokens = flattenTokens(content, fileName);
    for (const [path, token] of fileTokens) {
      oldFlat.set(path, token);
    }
  }

  for (const [fileName, content] of Object.entries(newTokens)) {
    const fileTokens = flattenTokens(content, fileName);
    for (const [path, token] of fileTokens) {
      newFlat.set(path, token);
    }
  }

  // Find all unique paths
  const allPaths = new Set([...oldFlat.keys(), ...newFlat.keys()]);

  for (const path of allPaths) {
    const oldToken = oldFlat.get(path);
    const newToken = newFlat.get(path);

    if (!oldToken && newToken) {
      // Added
      diffs.push({
        path,
        status: "added",
        newValue: newToken.$value || newToken.value,
        newToken,
      });
    } else if (oldToken && !newToken) {
      // Removed
      diffs.push({
        path,
        status: "removed",
        oldValue: oldToken.$value || oldToken.value,
        oldToken,
      });
    } else if (oldToken && newToken) {
      // Check if modified
      const oldValue = JSON.stringify(oldToken);
      const newValue = JSON.stringify(newToken);

      if (oldValue !== newValue) {
        diffs.push({
          path,
          status: "modified",
          oldValue: oldToken.$value || oldToken.value,
          newValue: newToken.$value || newToken.value,
          oldToken,
          newToken,
        });
      } else {
        diffs.push({
          path,
          status: "unchanged",
          oldValue: oldToken.$value || oldToken.value,
          newValue: newToken.$value || newToken.value,
          oldToken,
          newToken,
        });
      }
    }
  }

  return diffs.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Apply selected diffs to the target tokens
 */
export function applyDiffs(targetTokens: Record<string, TokenContent>, diffs: TokenDiff[], selectedPaths: Set<string>): Record<string, TokenContent> {
  const result = JSON.parse(JSON.stringify(targetTokens)); // Deep clone

  for (const diff of diffs) {
    if (!selectedPaths.has(diff.path)) continue;
    if (diff.status === "unchanged") continue;

    // Parse the path
    const parts = diff.path.split(".");
    if (parts.length < 2) continue; // Need at least filename.token

    const fileName = parts[0];
    const tokenPath = parts.slice(1);

    // Ensure the file exists in result
    if (!result[fileName]) {
      result[fileName] = {};
    }

    // Navigate to the parent and apply the change
    let current: any = result[fileName];
    for (let i = 0; i < tokenPath.length - 1; i++) {
      if (!current[tokenPath[i]]) {
        current[tokenPath[i]] = {};
      }
      current = current[tokenPath[i]];
    }

    const lastKey = tokenPath[tokenPath.length - 1];

    if (diff.status === "added" || diff.status === "modified") {
      current[lastKey] = diff.newToken;
    } else if (diff.status === "removed") {
      delete current[lastKey];
    }
  }

  return result;
}
