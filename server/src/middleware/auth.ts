//middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { Types } from 'mongoose';
import { connectDatabase } from '../config/database';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      auth?: any; // Keep for backward compatibility if needed
      user?: {
        id: string;
        email?: string;
        phone: string;
        role: string;
        status: string;
        name?: string; // Keep for backward compatibility
      };
    }
  }
}

// New JWT validation middleware using our local auth service
export const checkJwt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'رمز المصادقة مطلوب' }
      });
      return;
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
      status: decoded.status
    };

    next();
  } catch (error: any) {
    logger.error('JWT verification failed:', error);
    
    if (error.message.includes('expired')) {
      res.status(401).json({
        success: false,
        error: { 
          message: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى',
          code: 'TOKEN_EXPIRED'
        }
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: { message: 'رمز المصادقة غير صحيح' }
    });
    return;
  }
};

// Extract user info and fetch fresh data from database
export const extractUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // The user info is already in req.user from checkJwt
    // We can optionally fetch fresh data from database if needed
    if (req.user?.id) {
      // Ensure MongoDB is connected before querying
      await connectDatabase();
      
      const user = await User.findById(req.user.id).select('-password');
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'المستخدم غير موجود' }
        });
        return;
      }

      // Check if user is still active
      if (user.status === 'suspended') {
        res.status(403).json({
          success: false,
          error: { message: 'الحساب معلق' }
        });
        return;
      }

      // Update req.user with fresh data - properly cast the ObjectId
      req.user = {
        id: (user._id as Types.ObjectId).toString(),
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        name: user.name // For backward compatibility
      };
    }

    next();
  } catch (error) {
    logger.error('Error extracting user:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في استخراج بيانات المستخدم' }
    });
    return;
  }
};

// Middleware to check if user has admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { message: 'المصادقة مطلوبة' }
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: { message: 'صلاحيات المدير مطلوبة' }
    });
    return;
  }

  next();
};

// Middleware to check if user account is active
export const requireActiveUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { message: 'المصادقة مطلوبة' }
    });
    return;
  }

  if (req.user.status !== 'active') {
    res.status(403).json({
      success: false,
      error: { message: 'الحساب غير نشط' }
    });
    return;
  }

  next();
};

// Legacy Auth0 JWT validation middleware (keep for backward compatibility if needed)
// Uncomment and use this if you still need Auth0 integration for some routes
/*
import { expressjwt as jwt } from 'express-jwt';
import { GetVerificationKey, expressJwtSecret } from 'jwks-rsa';

export const checkAuth0Jwt = jwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }) as GetVerificationKey,
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

export const extractAuth0User = (req: Request, res: Response, next: NextFunction) => {
  if (req.auth) {
    req.user = {
      id: req.auth.sub,
      email: req.auth.email,
      name: req.auth.name
    };
  }
  next();
};
*/