/**
 * Impact Analysis Engine
 * PRD 0057: Onboarding Automation & Impact Analysis
 *
 * Builds a dependency graph to show which tokens are affected when a primitive token changes.
 */

import type { TokenContent } from "@core/types";

export interface TokenReference {
  tokenPath: string;
  filePath: string;
  value: any;
}

export interface ImpactAnalysis {
  directReferences: TokenReference[];
  indirectReferences: TokenReference[];
  totalImpact: number;
  affectedProjects: string[];
}

/**
 * Build a reverse dependency map showing which tokens reference each token
 * Returns: { "color.blue.500": ["semantic.bg.brand", "brand.primary"] }
 */
export function buildReverseUsageMap(
  allTokens: Record<string, TokenContent>
): Map<string, Set<string>> {
  const usageMap = new Map<string, Set<string>>();

  // Iterate through all files and tokens
  Object.entries(allTokens).forEach(([filePath, content]) => {
    traverseTokens(content, [], (path, value) => {
      const fullPath = path.join(".");

      // Check if this token references another token (alias)
      if (typeof value === "object" && value !== null) {
        if (value.$value && typeof value.$value === "string") {
          const refMatch = value.$value.match(/\{([^}]+)\}/);
          if (refMatch) {
            const referencedToken = refMatch[1];
            if (!usageMap.has(referencedToken)) {
              usageMap.set(referencedToken, new Set());
            }
            usageMap.get(referencedToken)!.add(fullPath);
          }
        }
      } else if (typeof value === "string") {
        const refMatch = value.match(/\{([^}]+)\}/);
        if (refMatch) {
          const referencedToken = refMatch[1];
          if (!usageMap.has(referencedToken)) {
            usageMap.set(referencedToken, new Set());
          }
          usageMap.get(referencedToken)!.add(fullPath);
        }
      }
    });
  });

  return usageMap;
}

/**
 * Traverse tokens recursively
 */
function traverseTokens(
  obj: any,
  currentPath: string[],
  callback: (path: string[], value: any) => void
) {
  for (const [key, value] of Object.entries(obj)) {
    const newPath = [...currentPath, key];

    if (typeof value === "object" && value !== null) {
      if (value.$value !== undefined) {
        // This is a token leaf node
        callback(newPath, value);
      } else {
        // This is a group, recurse
        traverseTokens(value, newPath, callback);
      }
    } else {
      // Primitive value
      callback(newPath, value);
    }
  }
}

/**
 * Get comprehensive impact analysis for a token
 * Shows direct and indirect (transitive) dependencies
 */
export function getImpactAnalysis(
  tokenPath: string,
  allTokens: Record<string, TokenContent>
): ImpactAnalysis {
  const usageMap = buildReverseUsageMap(allTokens);
  const directReferences: TokenReference[] = [];
  const indirectReferences: TokenReference[] = [];
  const visited = new Set<string>();

  // Get direct references
  const directDeps = usageMap.get(tokenPath) || new Set();
  directDeps.forEach((dep) => {
    directReferences.push({
      tokenPath: dep,
      filePath: findTokenFile(dep, allTokens),
      value: getTokenValue(dep, allTokens),
    });
  });

  // Get indirect references (tokens that reference the direct references)
  function findIndirectRefs(path: string, depth: number = 0) {
    if (visited.has(path) || depth > 10) return; // Prevent infinite loops
    visited.add(path);

    const deps = usageMap.get(path) || new Set();
    deps.forEach((dep) => {
      if (!directDeps.has(dep)) {
        indirectReferences.push({
          tokenPath: dep,
          filePath: findTokenFile(dep, allTokens),
          value: getTokenValue(dep, allTokens),
        });
      }
      findIndirectRefs(dep, depth + 1);
    });
  }

  directDeps.forEach((dep) => findIndirectRefs(dep));

  // Identify affected projects (simplified - assumes file structure)
  const affectedFiles = new Set<string>();
  [...directReferences, ...indirectReferences].forEach((ref) => {
    affectedFiles.add(ref.filePath);
  });

  return {
    directReferences,
    indirectReferences,
    totalImpact: directReferences.length + indirectReferences.length,
    affectedProjects: Array.from(affectedFiles),
  };
}

/**
 * Find which file contains a given token path
 */
function findTokenFile(
  tokenPath: string,
  allTokens: Record<string, TokenContent>
): string {
  for (const [filePath, content] of Object.entries(allTokens)) {
    if (tokenExistsInContent(tokenPath, content)) {
      return filePath;
    }
  }
  return "unknown";
}

/**
 * Check if a token path exists in content
 */
function tokenExistsInContent(
  tokenPath: string,
  content: TokenContent
): boolean {
  const parts = tokenPath.split(".");
  let current: any = content;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return false;
    }
  }

  return true;
}

/**
 * Get the value of a token by path
 */
function getTokenValue(
  tokenPath: string,
  allTokens: Record<string, TokenContent>
): any {
  for (const content of Object.values(allTokens)) {
    const parts = tokenPath.split(".");
    let current: any = content;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }

    if (current !== null) {
      return current.$value || current;
    }
  }

  return null;
}

/**
 * Calculate "blast radius" severity based on impact count
 */
export function getBlastRadiusSeverity(impactCount: number): {
  level: "low" | "medium" | "high" | "critical";
  label: string;
  color: string;
} {
  if (impactCount === 0) {
    return { level: "low", label: "No Impact", color: "success" };
  } else if (impactCount <= 3) {
    return { level: "low", label: "Low Impact", color: "info" };
  } else if (impactCount <= 10) {
    return { level: "medium", label: "Medium Impact", color: "warning" };
  } else if (impactCount <= 25) {
    return { level: "high", label: "High Impact", color: "orange" };
  } else {
    return { level: "critical", label: "Critical Impact", color: "danger" };
  }
}
