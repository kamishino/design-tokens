/**
 * Zod Validation Middleware
 * PRD 0062: Entity Management & Governance
 */

import { formatZodErrors } from '../lib/schemas.js';

/**
 * Middleware factory to validate request body against a Zod schema
 * @param {ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      // Validate and parse the request body
      const validated = schema.parse(req.body);
      
      // Replace req.body with validated data (with defaults applied)
      req.body = validated;
      
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const formattedErrors = formatZodErrors(error);
        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors,
          fields: Object.keys(formattedErrors),
        });
      }
      
      // Handle unexpected errors
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Middleware to validate query parameters against a Zod schema
 * @param {ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const formattedErrors = formatZodErrors(error);
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: formattedErrors,
        });
      }
      
      console.error('Query validation error:', error);
      return res.status(500).json({
        error: 'Internal validation error',
      });
    }
  };
}

export default {
  validateBody,
  validateQuery,
};
