// routes/auth.ts - Cleaned and Fixed Version
import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { 
  registerSchema, 
  loginSchema, 
  resetPasswordSchema,
  transformRegisterData,
  parseIdentifier
} from '../utils/validation';
import { authService } from '../services/authService';
import { passwordResetService } from '../services/passwordResetService';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { z } from 'zod';
import { phoneValidationSchema, normalizePhoneNumber } from '../utils/phoneValidation';

const router = Router();

// Public route for testing
router.get('/public', (req: Request, res: Response) => {
  res.json({ 
    message: 'This is a public endpoint! 🌍',
    timestamp: new Date().toISOString()
  });
});

// Protected route for testing
router.get('/protected', checkJwt, extractUser, (req: Request, res: Response) => {
  res.json({ 
    message: 'This is a protected endpoint! 🔒',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Get current user profile
router.get('/me', checkJwt, extractUser, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    return res.json({ 
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        customCity: user.customCity,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في الخادم' }
    });
  }
});

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const userData = transformRegisterData(validationResult.data);

    // Check if phone number already exists for the same role
    const existingUserByPhone = await User.findOne({ phone: userData.phone, role: 'user' });
    if (existingUserByPhone) {
      return res.status(400).json({
        success: false,
        error: { message: 'رقم الهاتف مستخدم بالفعل' }
      });
    }

    // Check if email already exists for the same role
    const existingUserByEmail = await User.findOne({ email: userData.email, role: 'user' });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        error: { message: 'البريد الإلكتروني مستخدم بالفعل' }
      });
    }

    // Check for password conflicts with existing accounts (same email/phone but different role)
    const existingAccountsByEmail = await User.find({ email: userData.email, role: 'admin' });
    const existingAccountsByPhone = await User.find({ phone: userData.phone, role: 'admin' });
    
    // Check if any existing account has the same password
    for (const account of [...existingAccountsByEmail, ...existingAccountsByPhone]) {
      const isPasswordSame = await account.comparePassword(userData.password);
      if (isPasswordSame) {
        return res.status(400).json({
          success: false,
          error: { message: 'كلمة المرور مستخدمة بالفعل لحساب آخر بنفس البريد الإلكتروني أو رقم الهاتف' }
        });
      }
    }

    // Create user in database
    const user = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      password: userData.password,
      city: userData.city,
      customCity: userData.city === 'اخري' ? userData.customCity : undefined, // Only set customCity if city is 'اخري'
      status: 'active' // No verification needed
    });

    await user.save();

    logger.info(`User registered successfully: ${userData.phone}`);

    // Generate tokens for immediate login
    const tokens = authService.generateTokens(user);

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type
      },
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        customCity: user.customCity,
        role: user.role,
        status: user.status
      }
    });

  } catch (error: any) {
    logger.error('Registration error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      if (field === 'phone') {
        return res.status(400).json({
          success: false,
          error: { message: 'رقم الهاتف مستخدم بالفعل' }
        });
      } else if (field === 'email') {
        return res.status(400).json({
          success: false,
          error: { message: 'البريد الإلكتروني مستخدم بالفعل' }
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إنشاء الحساب' }
    });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const { identifier, password } = validationResult.data;

    // Parse identifier to determine if it's email or phone
    const { type, value } = parseIdentifier(identifier);

    // Find all users with the same email or phone
    const query = type === 'email' ? { email: value } : { phone: value };
    const users = await User.find(query);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'بيانات تسجيل الدخول غير صحيحة' }
      });
    }

    // Find the user with matching password
    let authenticatedUser = null;
    for (const user of users) {
      // Check if user is active
      if (user.status === 'suspended') {
        continue; // Skip suspended accounts
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (isPasswordValid) {
        authenticatedUser = user;
        break; // Found the correct user
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        error: { message: 'بيانات تسجيل الدخول غير صحيحة' }
      });
    }

    // Update last login time
    authenticatedUser.lastLogin = new Date();
    await authenticatedUser.save();

    // Generate tokens
    const tokens = authService.generateTokens(authenticatedUser);

    logger.info(`User logged in successfully: ${type === 'email' ? authenticatedUser.email : authenticatedUser.phone} (Role: ${authenticatedUser.role})`);

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type
      },
      user: {
        id: authenticatedUser._id,
        firstName: authenticatedUser.firstName,
        lastName: authenticatedUser.lastName,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        phone: authenticatedUser.phone,
        city: authenticatedUser.city,
        customCity: authenticatedUser.customCity,
        role: authenticatedUser.role,
        status: authenticatedUser.status,
        lastLogin: authenticatedUser.lastLogin
      }
    });

  } catch (error: any) {
    logger.error('Login error:', error);
    
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تسجيل الدخول' }
    });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: { message: 'رمز التحديث مطلوب' }
      });
    }

    // Verify refresh token
    const decoded = authService.verifyRefreshToken(refresh_token);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: { message: 'الحساب معلق' }
      });
    }

    // Generate new access token
    const newTokens = await authService.refreshAccessToken(refresh_token, user);

    return res.json({
      success: true,
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in,
      token_type: 'Bearer'
    });

  } catch (error: any) {
    logger.error('Token refresh error:', error);
    
    return res.status(401).json({
      success: false,
      error: { message: 'فشل في تحديث الجلسة' }
    });
  }
});

// Logout (optional - since we're using stateless JWT)
router.post('/logout', checkJwt, extractUser, async (req: Request, res: Response) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by simply removing the tokens. However, we can log the logout event.
    
    logger.info(`User logged out: ${req.user?.id}`);

    return res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تسجيل الخروج' }
    });
  }
});

// Password reset routes
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const { email } = validationResult.data;

    const result = await passwordResetService.initiatePasswordReset(email);

    return res.json({
      success: true,
      message: result.message
    });

  } catch (error: any) {
    logger.error('Forgot password error:', error);
    
    return res.status(400).json({
      success: false,
      error: { message: error.message || 'فشل في بدء عملية إعادة تعيين كلمة المرور' }
    });
  }
});

// Verify reset token (for frontend to check if token is valid)
router.get('/verify-reset-token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: { message: 'رمز التحقق مطلوب' }
      });
    }

    const tokenString = Array.isArray(token) ? token[0] : token;
    const result = await passwordResetService.verifyResetToken(tokenString);

    return res.json({
      success: true,
      valid: result.valid,
      email: result.email
    });

  } catch (error: any) {
    logger.error('Verify reset token error:', error);
    
    return res.status(400).json({
      success: false,
      error: { message: 'خطأ في التحقق من الرمز' }
    });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: { message: 'رمز إعادة التعيين مطلوب' }
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: { message: 'كلمة المرور الجديدة مطلوبة' }
      });
    }

    // Simple password validation for reset (less strict than registration)
    const passwordValidation = z.string()
      .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      .safeParse(password);

    if (!passwordValidation.success) {
      const firstError = passwordValidation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const result = await passwordResetService.resetPassword(token, password);

    return res.json({
      success: true,
      message: result.message
    });

  } catch (error: any) {
    logger.error('Reset password error:', error);
    
    return res.status(400).json({
      success: false,
      error: { message: error.message || 'فشل في إعادة تعيين كلمة المرور' }
    });
  }
});

// ==================================================
// ACCOUNT SETTINGS ENDPOINTS
// ==================================================

/**
 * PUT /api/auth/profile
 * Update user profile information
 */
router.put('/profile', checkJwt, extractUser, requireActiveUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const profileUpdateSchema = z.object({
      firstName: z.string().min(1, 'الاسم الأول مطلوب').max(25, 'الاسم الأول لا يجب أن يتجاوز 25 حرف'),
      lastName: z.string().min(1, 'الاسم الأخير مطلوب').max(25, 'الاسم الأخير لا يجب أن يتجاوز 25 حرف'),
      email: z.string().email('البريد الإلكتروني غير صحيح'),
      phone: phoneValidationSchema,
      city: z.enum(['المدينة المنورة', 'جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف', 'اخري']),
      customCity: z.string()
        .min(2, 'اسم المدينة يجب أن يكون حرفين على الأقل')
        .max(50, 'اسم المدينة طويل جداً')
        .trim()
        .optional()
    }).refine((data) => {
      // If city is 'اخري', customCity must be provided
      if (data.city === 'اخري' && (!data.customCity || data.customCity.trim().length === 0)) {
        return false;
      }
      return true;
    }, {
      message: 'يجب إدخال اسم المدينة عند اختيار "أخرى"',
      path: ['customCity']
    });

    const validationResult = profileUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      
      // Handle city enum error specifically
      let errorMessage = firstError.message;
      if (firstError.path.includes('city') && firstError.code === 'invalid_type') {
        errorMessage = 'المدينة غير صحيحة. يجب اختيار إحدى المدن المتاحة';
      }
      
      return res.status(400).json({
        success: false,
        error: { message: errorMessage }
      });
    }

    const { firstName, lastName, email, phone, city, customCity } = validationResult.data;

    // Normalize the phone number to international format
    const fullPhoneNumber = normalizePhoneNumber(phone);

    // Get current user to check their role
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Check if email is already taken by another user with the same role
    const existingEmailUser = await User.findOne({ 
      email: email.toLowerCase(), 
      role: currentUser.role,
      _id: { $ne: userId } 
    });
    
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'البريد الإلكتروني مستخدم بالفعل' }
      });
    }

    // Check if phone is already taken by another user with the same role
    const existingPhoneUser = await User.findOne({ 
      phone: fullPhoneNumber, 
      role: currentUser.role,
      _id: { $ne: userId } 
    });
    
    if (existingPhoneUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'رقم الهاتف مستخدم بالفعل' }
      });
    }

    // FIXED: Update user profile with explicit name concatenation
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // FIXED: Explicitly set the concatenated name
        email: email.toLowerCase(),
        phone: fullPhoneNumber, // FIXED: Store with +966 prefix
        city,
        customCity: city === 'اخري' ? customCity : undefined // Only set customCity if city is 'اخري'
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    logger.info(`Profile updated for user ${userId}`);

    return res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.name, // This will now be properly updated
        email: updatedUser.email,
        phone: updatedUser.phone,
        city: updatedUser.city,
        customCity: updatedUser.customCity,
        role: updatedUser.role,
        status: updatedUser.status,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt
      }
    });

  } catch (error) {
    logger.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث الملف الشخصي' }
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', checkJwt, extractUser, requireActiveUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Validate request body
    const changePasswordSchema = z.object({
      currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
      newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    });

    const validationResult = changePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Find user with password field
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'كلمة المرور الحالية غير صحيحة' }
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'كلمة المرور الجديدة يجب أن تختلف عن الحالية' }
      });
    }

    // Check for password conflicts with other accounts (same email/phone but different role)
    const otherAccountsByEmail = await User.find({ 
      email: user.email, 
      role: { $ne: user.role },
      _id: { $ne: userId }
    });
    const otherAccountsByPhone = await User.find({ 
      phone: user.phone, 
      role: { $ne: user.role },
      _id: { $ne: userId }
    });
    
    // Check if any other account has the same password
    for (const account of [...otherAccountsByEmail, ...otherAccountsByPhone]) {
      const isPasswordSame = await account.comparePassword(newPassword);
      if (isPasswordSame) {
        return res.status(400).json({
          success: false,
          error: { message: 'كلمة المرور الجديدة مستخدمة بالفعل لحساب آخر بنفس البريد الإلكتروني أو رقم الهاتف' }
        });
      }
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user ${userId}`);

    return res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    logger.error('Error changing password:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تغيير كلمة المرور' }
    });
  }
});

/**
 * GET /api/auth/account-stats
 * Get user account statistics
 */
router.get('/account-stats', checkJwt, extractUser, requireActiveUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const user = await User.findById(userId).select('wishlist compareList cart createdAt lastLogin');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const stats = {
      wishlistCount: user.wishlist.length,
      compareCount: user.compareList.length,
      cartCount: user.cart.length,
      ordersCount: 0, // You can implement order counting later
      joinDate: user.createdAt,
      lastLogin: user.lastLogin || user.createdAt
    };

    return res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Error fetching account stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب إحصائيات الحساب' }
    });
  }
});

export default router;