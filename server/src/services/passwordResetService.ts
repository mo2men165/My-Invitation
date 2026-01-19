// server/src/services/passwordResetService.ts
import { emailService } from './emailService';
import { authService } from './authService';
import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';
import { User, IUser } from '../models/User';
import { Types } from 'mongoose';

interface PasswordResetData {
  userId: string;
  email: string;
  expiresAt: Date;
  used?: boolean; // Marked as used after successful reset (kept for verification during redirect)
}

class PasswordResetService {
  private readonly RESET_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
  private readonly MAX_RESET_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION = 30 * 60; // 30 minutes in seconds

  /**
   * Generate a secure password reset token
   */
  private generateResetToken(userId: string): string {
    return authService.generatePasswordResetToken(userId);
  }

  /**
   * Store reset token data in Redis
   */
  private async storeResetData(token: string, data: PasswordResetData): Promise<void> {
    const redis = getRedisClient();
    const key = `password_reset:${token}`;
    
    await redis.setEx(key, this.RESET_TOKEN_EXPIRY, JSON.stringify(data));
    logger.info(`Password reset token stored for user: ${data.userId}`);
  }

  /**
   * Get reset data from Redis
   */
  private async getResetData(token: string): Promise<PasswordResetData | null> {
    try {
      const redis = getRedisClient();
      const key = `password_reset:${token}`;
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data.toString()) as PasswordResetData;
    } catch (error) {
      logger.error('Error retrieving reset data:', error);
      return null;
    }
  }

  /**
   * Delete reset token from Redis
   */
  private async deleteResetToken(token: string): Promise<void> {
    const redis = getRedisClient();
    const key = `password_reset:${token}`;
    await redis.del(key);
  }

  /**
   * Mark reset token as used (instead of deleting immediately)
   * This allows the frontend to still verify the token during redirect
   * while preventing the token from being reused for another reset
   */
  private async markTokenAsUsed(token: string, data: PasswordResetData): Promise<void> {
    const redis = getRedisClient();
    const key = `password_reset:${token}`;
    
    // Update the token data to mark it as used, keep it for 60 seconds to allow redirect
    const usedData: PasswordResetData = { ...data, used: true };
    await redis.setEx(key, 60, JSON.stringify(usedData)); // 60 seconds should be plenty for redirect
    
    logger.info(`Password reset token marked as used for user: ${data.userId}`);
  }

  /**
   * Check rate limiting for password reset attempts
   */
  private async checkRateLimit(email: string): Promise<void> {
    const redis = getRedisClient();
    const key = `reset_attempts:${email.toLowerCase()}`;
    
    const attempts = await redis.incr(key);
    await redis.expire(key, this.LOCKOUT_DURATION);
    
    if (Number(attempts) > this.MAX_RESET_ATTEMPTS) {
      throw new Error('تم تجاوز عدد محاولات إعادة تعيين كلمة المرور. حاول مرة أخرى خلال 30 دقيقة');
    }
  }

  /**
   * Send password reset email
   */
  private async sendResetEmail(user: IUser, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await emailService.sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      resetLink
    });
    
    logger.info(`Password reset email sent to: ${user.email}`);
  }

  /**
   * Initiate password reset process
   */
  async initiatePasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check rate limiting
      await this.checkRateLimit(email);

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'إذا كان البريد الإلكتروني مسجل لدينا، ستتلقى رسالة لإعادة تعيين كلمة المرور'
        };
      }

      // Check if user account is active
      if (user.status !== 'active') {
        throw new Error('الحساب غير نشط. يرجى التواصل مع الدعم الفني');
      }

      // Generate reset token
      const token = this.generateResetToken((user._id as Types.ObjectId).toString());
      
      // Store reset data
      await this.storeResetData(token, {
        userId: (user._id as Types.ObjectId).toString(),
        email: user.email,
        expiresAt: new Date(Date.now() + this.RESET_TOKEN_EXPIRY * 1000)
      });

      // Send reset email
      await this.sendResetEmail(user, token);

      logger.info(`Password reset initiated for user: ${user._id}`);

      return {
        success: true,
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
      };

    } catch (error: any) {
      logger.error('Password reset initiation error:', error);
      throw new Error(error.message || 'فشل في بدء عملية إعادة تعيين كلمة المرور');
    }
  }

  /**
   * Verify reset token and reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify token format
      const decoded = authService.verifyPasswordResetToken(token);
      
      // Get reset data from Redis
      const resetData = await this.getResetData(token);
      
      if (!resetData) {
        throw new Error('رابط إعادة تعيين كلمة المرور غير صحيح أو منتهي الصلاحية');
      }

      // Check if token was already used (prevent reuse)
      if (resetData.used) {
        throw new Error('تم استخدام هذا الرابط مسبقاً');
      }

      // Verify token belongs to the same user
      if (decoded.id !== resetData.userId) {
        throw new Error('رابط إعادة تعيين كلمة المرور غير صحيح');
      }

      // Find user
      const user = await User.findById(resetData.userId);
      
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      if (user.status !== 'active') {
        throw new Error('الحساب غير نشط');
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      // Mark token as used instead of deleting immediately
      // This allows frontend verification to still work during redirect
      await this.markTokenAsUsed(token, resetData);

      // Clear rate limit attempts
      const redis = getRedisClient();
      await redis.del(`reset_attempts:${resetData.email.toLowerCase()}`);

      logger.info(`Password reset completed for user: ${user._id}`);

      return {
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول'
      };

    } catch (error: any) {
      logger.error('Password reset completion error:', error);
      throw new Error(error.message || 'فشل في إعادة تعيين كلمة المرور');
    }
  }

  /**
   * Verify if reset token is valid (for frontend validation)
   * Returns valid: true even for "used" tokens to prevent UI issues during redirect
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; userId?: string; email?: string }> {
    try {
      // Verify token format
      const decoded = authService.verifyPasswordResetToken(token);
      
      // Get reset data from Redis
      const resetData = await this.getResetData(token);
      
      if (!resetData || decoded.id !== resetData.userId) {
        return { valid: false };
      }

      // Return valid: true even for used tokens
      // This allows frontend to display correctly during redirect after successful reset
      // The actual reset endpoint checks for "used" status and rejects reuse attempts
      return {
        valid: true,
        userId: resetData.userId,
        email: resetData.email
      };

    } catch (error) {
      logger.error('Reset token verification error:', error);
      return { valid: false };
    }
  }
}

export const passwordResetService = new PasswordResetService();