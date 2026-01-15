/**
 * Token Export Utilities
 * PRD 0064: Advanced Token Management System
 * 
 * Provides utilities for exporting token data to various formats
 */

import type { Token } from '../hooks/useTokenCollection';

/**
 * Convert tokens to CSV format
 */
export function tokensToCSV(tokens: Token[]): string {
  if (tokens.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = ['Path', 'Name', 'Type', 'Value', 'Description', 'Brand', 'Theme', 'Status', 'Created At', 'Updated At'];
  
  // Escape CSV field (handle commas, quotes, newlines)
  const escapeField = (field: any): string => {
    if (field === null || field === undefined) {
      return '';
    }
    
    const str = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  };

  // Format value based on type
  const formatValue = (token: Token): string => {
    const value = token.value;
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Build CSV rows
  const rows = tokens.map((token) => [
    escapeField(token.path),
    escapeField(token.name),
    escapeField(token.type),
    escapeField(formatValue(token)),
    escapeField(token.description || ''),
    escapeField(token.brand || ''),
    escapeField(token.theme || ''),
    escapeField(token.status || ''),
    escapeField(token.created_at || ''),
    escapeField(token.updated_at || ''),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'tokens.csv'): void {
  // Create blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export tokens to CSV and download
 */
export function exportTokensToCSV(tokens: Token[], filename?: string): void {
  const csv = tokensToCSV(tokens);
  
  if (!csv) {
    console.warn('No tokens to export');
    return;
  }
  
  const defaultFilename = `tokens-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename || defaultFilename);
}

/**
 * Convert tokens to JSON format
 */
export function tokensToJSON(tokens: Token[]): string {
  return JSON.stringify(tokens, null, 2);
}

/**
 * Download JSON file
 */
export function downloadJSON(jsonContent: string, filename: string = 'tokens.json'): void {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export tokens to JSON and download
 */
export function exportTokensToJSON(tokens: Token[], filename?: string): void {
  const json = tokensToJSON(tokens);
  const defaultFilename = `tokens-${new Date().toISOString().split('T')[0]}.json`;
  downloadJSON(json, filename || defaultFilename);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
