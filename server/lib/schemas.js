/**
 * Zod Validation Schemas for Multi-project Entities
 * PRD 0062: Entity Management & Governance
 */

import { z } from 'zod';

// ============================================================================
// ORGANIZATION SCHEMAS
// ============================================================================

export const organizationCreateSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be at most 100 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

export const organizationUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be at most 100 characters')
    .optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

export const projectCreateSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be at most 100 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  git_url: z.string().url('Git URL must be a valid URL').optional().or(z.literal('')),
  create_default_brand: z.boolean().default(false),
});

export const projectUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be at most 100 characters')
    .optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  git_url: z.string().url('Git URL must be a valid URL').optional().or(z.literal('')),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// ============================================================================
// BRAND SCHEMAS
// ============================================================================

export const brandCreateSchema = z.object({
  name: z.string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be at most 100 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  is_default: z.boolean().default(false),
});

export const brandUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be at most 100 characters')
    .optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  is_default: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format Zod validation errors into a user-friendly structure
 */
export function formatZodErrors(error) {
  const formatted = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });
  return formatted;
}

export default {
  organizationCreateSchema,
  organizationUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  brandCreateSchema,
  brandUpdateSchema,
  formatZodErrors,
};
