import * as jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import { logger } from '../config/logger';
import { Types } from 'mongoose';

interface TokenPayload {
  id: string;
  email?: string;
  phone: string;
  role: string;
  status: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '1h';
  private readonly REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET!;
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
    
    if (!this.JWT_SECRET || !this.JWT_REFRESH_SECRET) {
      throw new Error('JWT secrets are required in environment variables');
    }
  }

  /**
   * Generate access and refresh tokens for a user
   */
  generateTokens(user: IUser): AuthTokens {
    const payload: TokenPayload = {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    };

    const access_token = jwt.sign(
      payload, 
      this.JWT_SECRET, 
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: process.env.JWT_ISSUER || 'my-invitation-app',
        audience: process.env.JWT_AUDIENCE || 'my-invitation-users'
      } as jwt.SignOptions
    );

    const refresh_token = jwt.sign(
      { id: (user._id as Types.ObjectId).toString() },
      this.JWT_REFRESH_SECRET,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: process.env.JWT_ISSUER || 'my-invitation-app',
        audience: process.env.JWT_AUDIENCE || 'my-invitation-users'
      } as jwt.SignOptions
    );

    return {
      access_token,
      refresh_token,
      expires_in: 3600, // 1 hour in seconds
      token_type: 'Bearer'
    };
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || 'my-invitation-app',
        audience: process.env.JWT_AUDIENCE || 'my-invitation-users'
      } as jwt.VerifyOptions) as TokenPayload;

      return decoded;
    } catch (error) {
      logger.error('Access token verification failed:', error);
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): { id: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET, {
        issuer: process.env.JWT_ISSUER || 'my-invitation-app',
        audience: process.env.JWT_AUDIENCE || 'my-invitation-users'
      } as jwt.VerifyOptions) as { id: string };

      return decoded;
    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Generate new access token from refresh token
   */
  async refreshAccessToken(refreshToken: string, user: IUser): Promise<{ access_token: string; expires_in: number }> {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Ensure the refresh token belongs to the user
      if (decoded.id !== (user._id as Types.ObjectId).toString()) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const payload: TokenPayload = {
        id: (user._id as Types.ObjectId).toString(),
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      };

      const access_token = jwt.sign(
        payload, 
        this.JWT_SECRET, 
        {
          expiresIn: this.ACCESS_TOKEN_EXPIRY,
          issuer: process.env.JWT_ISSUER || 'my-invitation-app',
          audience: process.env.JWT_AUDIENCE || 'my-invitation-users'
        } as jwt.SignOptions
      );

      return {
        access_token,
        expires_in: 3600
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Generate a secure random password reset token
   */
  generatePasswordResetToken(userId: string): string {
    return jwt.sign(
      { 
        id: userId, 
        purpose: 'password_reset',
        timestamp: Date.now()
      },
      this.JWT_SECRET,
      { 
        expiresIn: '15m' // Password reset tokens expire in 15 minutes
      } as jwt.SignOptions
    );
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): { id: string; purpose: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { 
        id: string; 
        purpose: string;
        timestamp: number;
      };

      if (decoded.purpose !== 'password_reset') {
        throw new Error('Invalid token purpose');
      }

      return { id: decoded.id, purpose: decoded.purpose };
    } catch (error) {
      logger.error('Password reset token verification failed:', error);
      throw new Error('Invalid or expired password reset token');
    }
  }
}

export const authService = new AuthService();