// routes/cart.ts
import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { CacheService } from '../services/cacheService';
import { 
  cartItemSchema, 
  updateCartItemSchema, 
  mongoIdSchema 
} from '../utils/validation';
import { Types } from 'mongoose';

const router = Router();

// Apply authentication middleware to all cart routes
router.use(checkJwt, extractUser, requireActiveUser);

/**
 * GET /api/cart
 * Get user's cart items
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Try cache first
    const cachedCart = await CacheService.getCachedUserCart(userId);
    if (cachedCart) {
      return res.json({
        success: true,
        cart: cachedCart,
        source: 'cache'
      });
    }

    // Fetch from database
    const user = await User.findById(userId).select('cart');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Cache the result
    await CacheService.cacheUserCart(userId, user.cart);

    logger.info(`Cart retrieved for user ${userId}, ${user.cart.length} items`);

    return res.json({
      success: true,
      cart: user.cart,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error fetching cart:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب السلة' }
    });
  }
});

/**
 * POST /api/cart
 * Add item to cart (no event creation until payment)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const validationResult = cartItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const cartItemData = validationResult.data;

    // Find user and check cart limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Check if cart is full
    if (user.cart.length >= 50) {
      return res.status(400).json({
        success: false,
        error: { message: 'السلة ممتلئة. الحد الأقصى 50 عنصر' }
      });
    }

    // Check if item already exists in cart
    const existingItem = user.cart.find(
      item => item.designId.toString() === cartItemData.designId && 
               item.packageType === cartItemData.packageType
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: { message: 'هذا العنصر موجود بالفعل في السلة' }
      });
    }

    // Create new cart item
    const newCartItem = {
      designId: new Types.ObjectId(cartItemData.designId),
      packageType: cartItemData.packageType,
      details: cartItemData.details,
      totalPrice: cartItemData.totalPrice,
      addedAt: new Date(),
      updatedAt: new Date()
    };

    // Add to cart
    user.cart.push(newCartItem);
    await user.save();

    // Update cache
    await CacheService.cacheUserCart(userId, user.cart);

    logger.info(`Item added to cart for user ${userId}, design: ${cartItemData.designId}`);

    return res.status(201).json({
      success: true,
      message: 'تم إضافة العنصر للسلة بنجاح',
      cartItem: user.cart[user.cart.length - 1],
      cartCount: user.cart.length
    });

  } catch (error) {
    logger.error('Error adding to cart:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إضافة العنصر للسلة' }
    });
  }
});

/**
 * PATCH /api/cart/:id
 * Update cart item
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validate cart item ID
    const paramValidation = mongoIdSchema.safeParse({ id });
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف العنصر غير صحيح' }
      });
    }

    // Validate request body
    const validationResult = updateCartItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const updateData = validationResult.data;

    // Find user and cart item
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const cartItemIndex = user.cart.findIndex(item => item._id?.toString() === id);
    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { message: 'العنصر غير موجود في السلة' }
      });
    }

    // Update cart item
    const cartItem = user.cart[cartItemIndex];
    
    if (updateData.designId) {
      cartItem.designId = new Types.ObjectId(updateData.designId);
    }
    if (updateData.packageType) {
      cartItem.packageType = updateData.packageType;
    }
    if (updateData.details) {
      cartItem.details = {
        ...cartItem.details,
        ...updateData.details
      };
      
      // Handle eventDate specifically
      if (updateData.details.eventDate) {
        cartItem.details.eventDate = new Date(updateData.details.eventDate);
      }
    }
    if (updateData.totalPrice !== undefined) {
      cartItem.totalPrice = updateData.totalPrice;
    }
    
    cartItem.updatedAt = new Date();

    await user.save();

    // Update cache
    await CacheService.cacheUserCart(userId, user.cart);

    logger.info(`Cart item updated for user ${userId}, item: ${id}`);

    return res.json({
      success: true,
      message: 'تم تحديث العنصر بنجاح',
      cartItem: cartItem
    });

  } catch (error) {
    logger.error('Error updating cart item:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث العنصر' }
    });
  }
});

/**
 * DELETE /api/cart/:id
 * Remove item from cart
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validate cart item ID
    const paramValidation = mongoIdSchema.safeParse({ id });
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف العنصر غير صحيح' }
      });
    }

    // Find user and remove cart item
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const initialLength = user.cart.length;
    user.cart = user.cart.filter(item => item._id?.toString() !== id);

    if (user.cart.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: { message: 'العنصر غير موجود في السلة' }
      });
    }

    await user.save();

    // Update cache
    await CacheService.cacheUserCart(userId, user.cart);

    logger.info(`Cart item removed for user ${userId}, item: ${id}`);

    return res.json({
      success: true,
      message: 'تم حذف العنصر من السلة',
      cartCount: user.cart.length
    });

  } catch (error) {
    logger.error('Error removing cart item:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في حذف العنصر' }
    });
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find user and clear cart
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const itemCount = user.cart.length;
    user.cart = [];
    await user.save();

    // Update cache
    await CacheService.cacheUserCart(userId, user.cart);

    logger.info(`Cart cleared for user ${userId}, ${itemCount} items removed`);

    return res.json({
      success: true,
      message: 'تم مسح السلة بالكامل',
      itemsRemoved: itemCount
    });

  } catch (error) {
    logger.error('Error clearing cart:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في مسح السلة' }
    });
  }
});

/**
 * GET /api/cart/count
 * Get cart items count (lightweight endpoint)
 */
router.get('/count', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Try cache first
    const cachedCart = await CacheService.getCachedUserCart(userId);
    if (cachedCart) {
      return res.json({
        success: true,
        count: cachedCart.length,
        source: 'cache'
      });
    }

    // Fetch count from database
    const user = await User.findById(userId).select('cart');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    return res.json({
      success: true,
      count: user.cart.length,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error fetching cart count:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب عدد عناصر السلة' }
    });
  }
});

/**
 * PATCH /api/cart/:id/field
 * Update specific field in cart item
 */
router.patch('/:id/field', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { field, value } = req.body;

    // Validate cart item ID
    const paramValidation = mongoIdSchema.safeParse({ id });
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف العنصر غير صحيح' }
      });
    }

    if (!field || value === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'يجب تحديد الحقل والقيمة' }
      });
    }

    // Find user and cart item
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const cartItemIndex = user.cart.findIndex(item => item._id?.toString() === id);
    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { message: 'العنصر غير موجود في السلة' }
      });
    }

    const cartItem = user.cart[cartItemIndex];

    // Handle different field types
    switch (field) {
      case 'packageType':
        if (!['classic', 'premium', 'vip'].includes(value)) {
          return res.status(400).json({
            success: false,
            error: { message: 'نوع الباقة غير صحيح' }
          });
        }
        cartItem.packageType = value;
        break;
      
      case 'totalPrice':
        if (typeof value !== 'number' || value < 0) {
          return res.status(400).json({
            success: false,
            error: { message: 'السعر يجب أن يكون رقم موجب' }
          });
        }
        cartItem.totalPrice = value;
        break;
      
      default:
        // Handle details fields
        if (field.startsWith('details.')) {
          const detailField = field.replace('details.', '');
          
          if (detailField === 'eventDate') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              return res.status(400).json({
                success: false,
                error: { message: 'تاريخ المناسبة غير صحيح' }
              });
            }
            cartItem.details.eventDate = date;
          } else if (detailField === 'inviteCount') {
            if (typeof value !== 'number' || value < 100 || value > 700) {
              return res.status(400).json({
                success: false,
                error: { message: 'عدد المدعوين يجب أن يكون بين 100 و 700' }
              });
            }
            cartItem.details.inviteCount = value;
          } else if (detailField === 'invitationText') {
            if (typeof value !== 'string' || value.length < 10 || value.length > 1000) {
              return res.status(400).json({
                success: false,
                error: { message: 'نص الدعوة يجب أن يكون بين 10 و 1000 حرف' }
              });
            }
            cartItem.details.invitationText = value;
          } else if (detailField === 'hostName') {
            if (typeof value !== 'string' || value.length < 2 || value.length > 100) {
              return res.status(400).json({
                success: false,
                error: { message: 'اسم المضيف يجب أن يكون بين 2 و 100 حرف' }
              });
            }
            cartItem.details.hostName = value;
          } else if (detailField === 'eventLocation') {
            if (typeof value !== 'string' || value.length < 1 || value.length > 200) {
              return res.status(400).json({
                success: false,
                error: { message: 'عنوان المناسبة يجب أن يكون بين 1 و 200 حرف' }
              });
            }
            cartItem.details.eventLocation = value;
          } else {
            // Handle other detail fields
            (cartItem.details as any)[detailField] = value;
          }
        } else {
          return res.status(400).json({
            success: false,
            error: { message: 'الحقل المحدد غير مدعوم' }
          });
        }
    }

    cartItem.updatedAt = new Date();
    await user.save();

    // Update cache
    await CacheService.cacheUserCart(userId, user.cart);

    logger.info(`Cart item field updated for user ${userId}, item: ${id}, field: ${field}`);

    return res.json({
      success: true,
      message: 'تم تحديث الحقل بنجاح',
      cartItem: cartItem
    });

  } catch (error) {
    logger.error('Error updating cart item field:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث الحقل' }
    });
  }
});

export default router;