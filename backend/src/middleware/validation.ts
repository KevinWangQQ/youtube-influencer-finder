import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

const searchRequestSchema = z.object({
  topic: z.string()
    .min(2, 'Topic must be at least 2 characters long')
    .max(100, 'Topic must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Topic contains invalid characters'),
  filters: z.object({
    region: z.string().length(2).optional().default('US'),
    minSubscribers: z.number().min(0).max(10000000).optional().default(1000),
    minViews: z.number().min(0).max(100000000).optional().default(10000),
    maxResults: z.number().min(1).max(100).optional().default(50)
  }).optional().default({})
});

const keywordExpansionSchema = z.object({
  topic: z.string()
    .min(2, 'Topic must be at least 2 characters long')
    .max(100, 'Topic must be less than 100 characters'),
  maxKeywords: z.number().min(3).max(20).optional().default(10),
  language: z.string().length(2).optional().default('en')
});

export const validateSearchRequest = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const validatedData = searchRequestSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Search request validation failed:', error.errors);
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        }
      });
      return;
    }
    
    logger.error('Unexpected validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

export const validateKeywordExpansion = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const validatedData = keywordExpansionSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Keyword expansion validation failed:', error.errors);
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        }
      });
      return;
    }
    
    logger.error('Unexpected validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};