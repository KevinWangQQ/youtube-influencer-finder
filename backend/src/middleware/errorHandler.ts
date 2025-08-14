import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (error.message.includes('API quota exceeded')) {
    statusCode = 429;
    code = 'API_QUOTA_EXCEEDED';
    message = 'API quota exceeded. Please try again later.';
  } else if (error.message.includes('OPENAI_API_KEY')) {
    statusCode = 500;
    code = 'CONFIG_ERROR';
    message = 'OpenAI API configuration error';
  } else if (error.message.includes('YOUTUBE_API_KEY')) {
    statusCode = 500;
    code = 'CONFIG_ERROR';
    message = 'YouTube API configuration error';
  } else if (error.message.includes('Network')) {
    statusCode = 503;
    code = 'NETWORK_ERROR';
    message = 'Network connection failed. Please try again.';
  }

  // Log error details
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`
    }
  });
};