// routes/compare.ts
import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { CacheService } from '../services/cacheService';
import { 
  compareItemSchema, 
  bulkCompareSchema,
  designIdSchema 
} from '../utils/validation';
import { Types } from 'mongoose';

const router = Router();

// Apply authentication middleware to all compare routes
router.use(checkJwt, extractUser, requireActiveUser);

/**
 * GET /api/compare
 * Get user's compare list
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Try cache first
    const cachedCompare = await CacheService.getCachedUserCompare(userId);
    if (cachedCompare) {
      return res.json({
        success: true,
        compareList: cachedCompare,
        source: 'cache'
      });
    }

    // Fetch from database
    const user = await User.findById(userId).select('compareList');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Cache the result
    await CacheService.cacheUserCompare(userId, user.compareList);

    logger.info(`Compare list retrieved for user ${userId}, ${user.compareList.length} items`);

    return res.json({
      success: true,
      compareList: user.compareList,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error fetching compare list:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب قائمة المقارنة' }
    });
  }
});

/**
 * POST /api/compare
 * Add item to compare list
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const validationResult = compareItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const { designId, packageType } = validationResult.data; // Extract packageType (required)

    // Find user and check compare list limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Check if compare list is full
    if (user.compareList.length >= 3) {
      return res.status(400).json({
        success: false,
        error: { message: 'قائمة المقارنة ممتلئة. يمكن مقارنة 3 تصاميم كحد أقصى' }
      });
    }

    // Check if item already exists in compare list (same design + package combo)
    const existingItem = user.compareList.find(
      item => item.designId.toString() === designId && item.packageType === packageType
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: { message: 'هذا التصميم بهذه الباقة موجود بالفعل في قائمة المقارنة' }
      });
    }

    // Create new compare item with required packageType
    const newCompareItem = {
      designId: new Types.ObjectId(designId),
      packageType, // Required field
      addedAt: new Date()
    };

    // Add to compare list
    user.compareList.push(newCompareItem);
    await user.save();

    // Update cache
    await CacheService.cacheUserCompare(userId, user.compareList);

    logger.info(`Item added to compare list for user ${userId}, design: ${designId}, package: ${packageType}`);

    return res.status(201).json({
      success: true,
      message: 'تم إضافة التصميم لقائمة المقارنة',
      compareItem: newCompareItem,
      compareCount: user.compareList.length
    });

  } catch (error) {
    logger.error('Error adding to compare list:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إضافة التصميم لقائمة المقارنة' }
    });
  }
});

/**
 * POST /api/compare/bulk
 * Replace compare list with new items (max 3)
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const validationResult = bulkCompareSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const { items } = validationResult.data; // Array of {designId, packageType}

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Create new compare items with unique design+package combinations
    const uniqueItems = items.reduce((acc, item) => {
      const key = `${item.designId}-${item.packageType}`;
      if (!acc.has(key)) {
        acc.set(key, item);
      }
      return acc;
    }, new Map());

    const newCompareItems = Array.from(uniqueItems.values()).map(item => ({
      designId: new Types.ObjectId(item.designId),
      packageType: item.packageType, // Required field
      addedAt: new Date()
    }));

    // Replace compare list
    user.compareList = newCompareItems;
    await user.save();

    // Update cache
    await CacheService.cacheUserCompare(userId, user.compareList);

    logger.info(`Compare list replaced for user ${userId}, ${newCompareItems.length} items`);

    return res.json({
      success: true,
      message: `تم تحديث قائمة المقارنة بـ ${newCompareItems.length} تصميم`,
      compareCount: user.compareList.length
    });

  } catch (error) {
    logger.error('Error bulk updating compare list:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث قائمة المقارنة' }
    });
  }
});

/**
 * DELETE /api/compare/:designId
 * Remove item from compare list
 */
router.delete('/:designId', async (req: Request, res: Response) => {
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

    // Find user and remove compare item
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const initialLength = user.compareList.length;
    user.compareList = user.compareList.filter(item => item.designId.toString() !== designId);

    if (user.compareList.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: { message: 'التصميم غير موجود في قائمة المقارنة' }
      });
    }

    await user.save();

    // Update cache
    await CacheService.cacheUserCompare(userId, user.compareList);

    logger.info(`Compare item removed for user ${userId}, design: ${designId}`);

    return res.json({
      success: true,
      message: 'تم حذف التصميم من قائمة المقارنة',
      compareCount: user.compareList.length
    });

  } catch (error) {
    logger.error('Error removing compare item:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في حذف التصميم من قائمة المقارنة' }
    });
  }
});

/**
 * DELETE /api/compare
 * Clear entire compare list
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find user and clear compare list
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const itemCount = user.compareList.length;
    user.compareList = [];
    await user.save();

    // Update cache
    await CacheService.cacheUserCompare(userId, user.compareList);

    logger.info(`Compare list cleared for user ${userId}, ${itemCount} items removed`);

    return res.json({
      success: true,
      message: 'تم مسح قائمة المقارنة بالكامل',
      itemsRemoved: itemCount
    });

  } catch (error) {
    logger.error('Error clearing compare list:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في مسح قائمة المقارنة' }
    });
  }
});

/**
 * GET /api/compare/check/:designId
 * Check if design is in compare list
 */
router.get('/check/:designId', async (req: Request, res: Response) => {
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
    const cachedCompare = await CacheService.getCachedUserCompare(userId);
    if (cachedCompare) {
      const inCompare = cachedCompare.some(item => item.designId.toString() === designId);
      return res.json({
        success: true,
        inCompare,
        source: 'cache'
      });
    }

    // Check database
    const user = await User.findById(userId).select('compareList');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const inCompare = user.compareList.some(item => item.designId.toString() === designId);

    return res.json({
      success: true,
      inCompare,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error checking compare list:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في فحص قائمة المقارنة' }
    });
  }
});

/**
 * GET /api/compare/count
 * Get compare list items count
 */
router.get('/count', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Try cache first
    const cachedCompare = await CacheService.getCachedUserCompare(userId);
    if (cachedCompare) {
      return res.json({
        success: true,
        count: cachedCompare.length,
        source: 'cache'
      });
    }

    // Fetch count from database
    const user = await User.findById(userId).select('compareList');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    return res.json({
      success: true,
      count: user.compareList.length,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error fetching compare count:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب عدد عناصر المقارنة' }
    });
  }
});

/**
 * GET /api/compare/full
 * Check if compare list is full (3 items)
 */
router.get('/full', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Try cache first
    const cachedCompare = await CacheService.getCachedUserCompare(userId);
    if (cachedCompare) {
      return res.json({
        success: true,
        isFull: cachedCompare.length >= 3,
        count: cachedCompare.length,
        source: 'cache'
      });
    }

    // Check database
    const user = await User.findById(userId).select('compareList');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    return res.json({
      success: true,
      isFull: user.compareList.length >= 3,
      count: user.compareList.length,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error checking if compare list is full:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في فحص قائمة المقارنة' }
    });
  }
});

export default router;