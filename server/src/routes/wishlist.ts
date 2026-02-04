// routes/wishlist.ts
import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { withDB } from '../utils/routeUtils';
import { CacheService } from '../services/cacheService';
import { 
  wishlistItemSchema, 
  bulkWishlistSchema,
  designIdSchema 
} from '../utils/validation';
import { Types } from 'mongoose';

const router = Router();

// Apply authentication middleware to all wishlist routes
router.use(checkJwt, extractUser, requireActiveUser);

/**
 * GET /api/wishlist
 * Get user's wishlist items
 */
router.get('/', withDB(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Try cache first
    const cachedWishlist = await CacheService.getCachedUserWishlist(userId);
    if (cachedWishlist) {
      return res.json({
        success: true,
        wishlist: cachedWishlist,
        source: 'cache'
      });
    }

    // Fetch from database
    const user = await User.findById(userId).select('wishlist');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Cache the result
    await CacheService.cacheUserWishlist(userId, user.wishlist);

    logger.info(`Wishlist retrieved for user ${userId}, ${user.wishlist.length} items`);

    return res.json({
      success: true,
      wishlist: user.wishlist,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error fetching wishlist:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب المفضلة' }
    });
  }
}));

/**
 * POST /api/wishlist
 * Add item to wishlist
 */

router.post('/', withDB(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const validationResult = wishlistItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const { designId, packageType } = validationResult.data; // Extract packageType

    // Find user and check wishlist limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Check if wishlist is full
    if (user.wishlist.length >= 200) {
      return res.status(400).json({
        success: false,
        error: { message: 'المفضلة ممتلئة. الحد الأقصى 200 عنصر' }
      });
    }

    // Check if item already exists in wishlist
    const existingItem = user.wishlist.find(
      item => item.designId.toString() === designId
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: { message: 'هذا التصميم موجود بالفعل في المفضلة' }
      });
    }

    // Create new wishlist item with optional packageType
    const newWishlistItem = {
      designId: new Types.ObjectId(designId),
      packageType, // Optional field
      addedAt: new Date()
    };

    // Add to wishlist
    user.wishlist.push(newWishlistItem);
    await user.save();

    // Update cache
    await CacheService.cacheUserWishlist(userId, user.wishlist);

    logger.info(`Item added to wishlist for user ${userId}, design: ${designId}, package: ${packageType || 'none'}`);

    return res.status(201).json({
      success: true,
      message: 'تم إضافة التصميم للمفضلة',
      wishlistItem: newWishlistItem,
      wishlistCount: user.wishlist.length
    });

  } catch (error) {
    logger.error('Error adding to wishlist:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إضافة التصميم للمفضلة' }
    });
  }
}));


router.post('/bulk', withDB(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const validationResult = bulkWishlistSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const { items } = validationResult.data; // Array of {designId, packageType?}

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Check if adding these items would exceed the limit
    if (user.wishlist.length + items.length > 200) {
      return res.status(400).json({
        success: false,
        error: { message: `تجاوز الحد الأقصى للمفضلة. يمكن إضافة ${200 - user.wishlist.length} عنصر فقط` }
      });
    }

    // Filter out duplicates
    const existingDesignIds = user.wishlist.map(item => item.designId.toString());
    const newItems = items.filter(item => !existingDesignIds.includes(item.designId));

    if (newItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'جميع التصاميم موجودة بالفعل في المفضلة' }
      });
    }

    // Create new wishlist items
    const newWishlistItems = newItems.map(item => ({
      designId: new Types.ObjectId(item.designId),
      packageType: item.packageType, // Optional field
      addedAt: new Date()
    }));

    // Add to wishlist
    user.wishlist.push(...newWishlistItems);
    await user.save();

    // Update cache
    await CacheService.cacheUserWishlist(userId, user.wishlist);

    logger.info(`${newWishlistItems.length} items added to wishlist for user ${userId}`);

    return res.status(201).json({
      success: true,
      message: `تم إضافة ${newWishlistItems.length} تصميم للمفضلة`,
      addedCount: newWishlistItems.length,
      skippedCount: items.length - newWishlistItems.length,
      wishlistCount: user.wishlist.length
    });

  } catch (error) {
    logger.error('Error bulk adding to wishlist:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إضافة التصاميم للمفضلة' }
    });
  }
}));
/**
 * DELETE /api/wishlist/:designId
 * Remove item from wishlist
 */
router.delete('/:designId', withDB(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { designId } = req.params;

    // Validate design ID
    const paramValidation = designIdSchema.safeParse({ designId });
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف التصميم غير صحيح' }
      });
    }

    // Find user and remove wishlist item
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const initialLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter(item => item.designId.toString() !== designId);

    if (user.wishlist.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: { message: 'التصميم غير موجود في المفضلة' }
      });
    }

    await user.save();

    // Update cache
    await CacheService.cacheUserWishlist(userId, user.wishlist);

    logger.info(`Wishlist item removed for user ${userId}, design: ${designId}`);

    return res.json({
      success: true,
      message: 'تم حذف التصميم من المفضلة',
      wishlistCount: user.wishlist.length
    });

  } catch (error) {
    logger.error('Error removing wishlist item:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في حذف التصميم من المفضلة' }
    });
  }
}));

/**
 * DELETE /api/wishlist
 * Clear entire wishlist
 */
router.delete('/', withDB(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find user and clear wishlist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const itemCount = user.wishlist.length;
    user.wishlist = [];
    await user.save();

    // Update cache
    await CacheService.cacheUserWishlist(userId, user.wishlist);

    logger.info(`Wishlist cleared for user ${userId}, ${itemCount} items removed`);

    return res.json({
      success: true,
      message: 'تم مسح المفضلة بالكامل',
      itemsRemoved: itemCount
    });

  } catch (error) {
    logger.error('Error clearing wishlist:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في مسح المفضلة' }
    });
  }
}));

/**
 * GET /api/wishlist/check/:designId
 * Check if design is in wishlist
 */
router.get('/check/:designId', withDB(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { designId } = req.params;

    // Validate design ID
    const paramValidation = designIdSchema.safeParse({ designId });
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف التصميم غير صحيح' }
      });
    }

    // Try cache first
    const cachedWishlist = await CacheService.getCachedUserWishlist(userId);
    if (cachedWishlist) {
      const inWishlist = cachedWishlist.some(item => item.designId.toString() === designId);
      return res.json({
        success: true,
        inWishlist,
        source: 'cache'
      });
    }

    // Check database
    const user = await User.findById(userId).select('wishlist');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const inWishlist = user.wishlist.some(item => item.designId.toString() === designId);

    return res.json({
      success: true,
      inWishlist,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error checking wishlist:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في فحص المفضلة' }
    });
  }
}));

/**
 * GET /api/wishlist/count
 * Get wishlist items count
 */
router.get('/count', withDB(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Try cache first
    const cachedWishlist = await CacheService.getCachedUserWishlist(userId);
    if (cachedWishlist) {
      return res.json({
        success: true,
        count: cachedWishlist.length,
        source: 'cache'
      });
    }

    // Fetch count from database
    const user = await User.findById(userId).select('wishlist');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    return res.json({
      success: true,
      count: user.wishlist.length,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error fetching wishlist count:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب عدد عناصر المفضلة' }
    });
  }
}));

export default router;