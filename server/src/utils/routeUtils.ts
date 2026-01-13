// server/src/utils/routeUtils.ts - Shared utilities for server routes
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

// Success response helper
export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  if (message) {
    response.data = { ...(data as any), message };
  }

  res.status(statusCode).json(response);
};

// Error response helper
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  code?: string,
  details?: any
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  res.status(statusCode).json(response);
};

// Validation error response helper
export const sendValidationError = (
  res: Response,
  errors: any,
  message: string = 'خطأ في التحقق من البيانات'
): void => {
  sendError(res, message, 400, 'VALIDATION_ERROR', errors);
};

// Not found response helper
export const sendNotFound = (
  res: Response,
  resource: string = 'المورد'
): void => {
  sendError(res, `${resource} غير موجود`, 404, 'NOT_FOUND');
};

// Unauthorized response helper
export const sendUnauthorized = (
  res: Response,
  message: string = 'غير مصرح لك بالوصول'
): void => {
  sendError(res, message, 401, 'UNAUTHORIZED');
};

// Forbidden response helper
export const sendForbidden = (
  res: Response,
  message: string = 'غير مسموح لك بهذا الإجراء'
): void => {
  sendError(res, message, 403, 'FORBIDDEN');
};

// Server error response helper
export const sendServerError = (
  res: Response,
  message: string = 'خطأ في الخادم'
): void => {
  sendError(res, message, 500, 'SERVER_ERROR');
};

// Common middleware for error handling
export const handleAsyncError = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common middleware for logging requests
export const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Common middleware for rate limiting (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return sendError(res, 'تم تجاوز الحد المسموح من الطلبات', 429, 'RATE_LIMIT');
    }
    
    clientData.count++;
    next();
  };
};

// Common pagination helper
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getPaginationOptions = (req: Request): PaginationOptions => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = ((req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  
  return { page, limit, sortBy, sortOrder };
};

// Common pagination response helper
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  pagination: PaginationOptions
): void => {
  const totalPages = Math.ceil(total / (pagination.limit || 10));
  
  sendSuccess(res, data, undefined, 200);
  
  // Add pagination metadata
  res.json({
    success: true,
    data,
    meta: {
      total,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      totalPages,
      hasNext: (pagination.page || 1) < totalPages,
      hasPrev: (pagination.page || 1) > 1,
      timestamp: new Date().toISOString()
    }
  });
};

// Common validation helper
export const validateRequired = (data: any, fields: string[]): string[] => {
  const missing: string[] = [];
  
  fields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  });
  
  return missing;
};

// Common sanitization helper
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    Object.keys(input).forEach(key => {
      sanitized[key] = sanitizeInput(input[key]);
    });
    return sanitized;
  }
  
  return input;
};
