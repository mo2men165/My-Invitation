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

// Types for lookup results
export type LookupResult = 
  | { found: true; hasEmail: true; email: string }  // User found with email - normal flow
  | { found: true; hasEmail: false; phone: string }  // User found but registered with phone only
  | { found: false };  // User not found in database

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
    const redisClient = await getRedisClient();
    const key = `password_reset:${token}`;
    
    await redisClient.setEx(key, this.RESET_TOKEN_EXPIRY, JSON.stringify(data));
    logger.info(`Password reset token stored for user: ${data.userId}`);
  }

  /**
   * Get reset data from Redis
   */
  private async getResetData(token: string): Promise<PasswordResetData | null> {
    try {
      const redisClient = await getRedisClient();
      const key = `password_reset:${token}`;
      const data = await redisClient.get(key);
      
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
    const redisClient = await getRedisClient();
    const key = `password_reset:${token}`;
    await redisClient.del(key);
  }

  /**
   * Mark reset token as used (instead of deleting immediately)
   * This allows the frontend to still verify the token during redirect
   * while preventing the token from being reused for another reset
   */
  private async markTokenAsUsed(token: string, data: PasswordResetData): Promise<void> {
    const redisClient = await getRedisClient();
    const key = `password_reset:${token}`;
    
    // Update the token data to mark it as used, keep it for 60 seconds to allow redirect
    const usedData: PasswordResetData = { ...data, used: true };
    await redisClient.setEx(key, 60, JSON.stringify(usedData)); // 60 seconds should be plenty for redirect
    
    logger.info(`Password reset token marked as used for user: ${data.userId}`);
  }

  /**
   * Check rate limiting for password reset attempts
   */
  private async checkRateLimit(email: string): Promise<void> {
    const redisClient = await getRedisClient();
    const key = `reset_attempts:${email.toLowerCase()}`;
    
    const attempts = await redisClient.incr(key);
    await redisClient.expire(key, this.LOCKOUT_DURATION);
    
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
      const redisClient = await getRedisClient();
      await redisClient.del(`reset_attempts:${resetData.email.toLowerCase()}`);

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

  /**
   * Lookup user by email or phone to determine their registration status
   * Returns information about whether user exists and if they have an email
   */
  async lookupUser(identifier: string, type: 'email' | 'phone'): Promise<LookupResult> {
    try {
      let user: IUser | null = null;

      if (type === 'email') {
        user = await User.findOne({ email: identifier.toLowerCase() });
      } else {
        // For phone, search with the full international format
        const fullPhone = identifier.startsWith('+966') ? identifier : `+966${identifier}`;
        user = await User.findOne({ phone: fullPhone });
      }

      if (!user) {
        return { found: false };
      }

      // User exists - check if they have an email
      // In this system, email is required during registration, but we're preparing
      // for users who might have registered with phone-only flow
      if (user.email && user.email.trim() !== '') {
        return { found: true, hasEmail: true, email: user.email };
      } else {
        return { found: true, hasEmail: false, phone: user.phone };
      }
    } catch (error) {
      logger.error('User lookup error:', error);
      throw new Error('خطأ في البحث عن المستخدم');
    }
  }

  /**
   * Initiate password reset for a user found by phone number
   * Stores the provided email in the user's profile and sends reset email to it
   */
  async initiatePasswordResetByPhone(phone: string, newEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check rate limiting using the phone number
      await this.checkRateLimit(phone);

      // Normalize phone number
      const fullPhone = phone.startsWith('+966') ? phone : `+966${phone}`;
      
      // Find user by phone
      const user = await User.findOne({ phone: fullPhone });

      if (!user) {
        throw new Error('لم يتم العثور على حساب مرتبط بهذا الرقم');
      }

      // Check if user account is active
      if (user.status !== 'active') {
        throw new Error('الحساب غير نشط. يرجى التواصل مع الدعم الفني');
      }

      // Check if the new email is already in use by another user
      const existingEmailUser = await User.findOne({ 
        email: newEmail.toLowerCase(), 
        _id: { $ne: user._id },
        role: user.role
      });

      if (existingEmailUser) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل من قبل مستخدم آخر');
      }

      // Update user's email in the database
      const oldEmail = user.email;
      user.email = newEmail.toLowerCase();
      await user.save();

      logger.info(`Email updated for user ${user._id} from ${oldEmail} to ${newEmail}`);

      // Generate reset token
      const token = this.generateResetToken((user._id as Types.ObjectId).toString());
      
      // Store reset data with the new email
      await this.storeResetData(token, {
        userId: (user._id as Types.ObjectId).toString(),
        email: newEmail.toLowerCase(),
        expiresAt: new Date(Date.now() + this.RESET_TOKEN_EXPIRY * 1000)
      });

      // Send reset email to the new email address (user.email is already updated and saved)
      await this.sendResetEmail(user, token);

      logger.info(`Password reset initiated for user: ${user._id} via phone lookup`);

      return {
        success: true,
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني الجديد'
      };

    } catch (error: any) {
      logger.error('Password reset by phone error:', error);
      throw new Error(error.message || 'فشل في بدء عملية إعادة تعيين كلمة المرور');
    }
  }

  /**
   * Check if a user exists by email or phone (for explicit user feedback)
   * Unlike initiatePasswordReset, this explicitly tells if user exists or not
   */
  async checkUserExists(identifier: string, type: 'email' | 'phone'): Promise<{ exists: boolean; hasEmail?: boolean }> {
    try {
      let user: IUser | null = null;

      if (type === 'email') {
        user = await User.findOne({ email: identifier.toLowerCase() });
      } else {
        const fullPhone = identifier.startsWith('+966') ? identifier : `+966${identifier}`;
        user = await User.findOne({ phone: fullPhone });
      }

      if (!user) {
        return { exists: false };
      }

      return { 
        exists: true, 
        hasEmail: !!(user.email && user.email.trim() !== '')
      };
    } catch (error) {
      logger.error('Check user exists error:', error);
      throw new Error('خطأ في التحقق من المستخدم');
    }
  }
}

export const passwordResetService = new PasswordResetService();
