// routes/events.ts
import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { eventStatusService } from '../services/eventStatusService';
import { Types } from 'mongoose';
import { z } from 'zod';

const router = Router();

// Apply authentication middleware to all event routes
router.use(checkJwt, extractUser, requireActiveUser);

// Validation schemas
const guestSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'رقم الهاتف يجب أن يكون بالصيغة الدولية (مثال: +966501234567)'),
  numberOfAccompanyingGuests: z.number().int().min(1).max(10)
});

const updateGuestSchema = guestSchema.partial();

/**
 * GET /api/events
 * Get user's events with filtering options
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, approvalStatus, limit = 10, page = 1 } = req.query;

    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (status && typeof status === 'string') {
      query.status = status;
    }
    
    if (approvalStatus && typeof approvalStatus === 'string') {
      query.approvalStatus = approvalStatus;
    }    

    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find(query)
      .sort({ 'details.eventDate': -1 })
      .limit(Number(limit))
      .skip(skip)
      .populate('designId', 'title images');

    const total = await Event.countDocuments(query);

    logger.info(`Events retrieved for user ${userId}, count: ${events.length}`);

    return res.json({
      success: true,
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching events:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب المناسبات' }
    });
  }
});

/**
 * GET /api/events/:id
 * Get specific event with full details including guests
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const event = await Event.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    }).populate('designId', 'title images');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // Calculate guest statistics
    const totalInvited = event.guests.reduce((sum, guest) => sum + guest.numberOfAccompanyingGuests, 0);
    const whatsappSent = event.guests.filter(guest => guest.whatsappMessageSent).length;

    return res.json({
      success: true,
      event,
      guestStats: {
        totalGuests: event.guests.length,
        totalInvited,
        whatsappMessagesSent: whatsappSent,
        remainingInvites: event.details.inviteCount - totalInvited
      }
    });

  } catch (error) {
    logger.error('Error fetching event:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب المناسبة' }
    });
  }
});

/**
 * POST /api/events/:id/guests
 * Add guest to event
 */
router.post('/:id/guests', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validate request body
    const validationResult = guestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const guestData = validationResult.data;

    const event = await Event.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // For VIP packages, check if guest list is already confirmed
    if (event.packageType === 'vip' && event.guestListConfirmed.isConfirmed) {
      return res.status(400).json({
        success: false,
        error: { message: 'تم تأكيد قائمة الضيوف مسبقاً. لا يمكن إضافة ضيوف جدد' }
      });
    }

    // Check if guest already exists
    const existingGuest = event.guests.find(guest => guest.phone === guestData.phone);
    if (existingGuest) {
      return res.status(400).json({
        success: false,
        error: { message: 'هذا الضيف موجود بالفعل' }
      });
    }

    // Check invite count limit
    const currentInvited = event.guests.reduce((sum, guest) => sum + guest.numberOfAccompanyingGuests, 0);
    const newTotalInvited = currentInvited + guestData.numberOfAccompanyingGuests;

    if (newTotalInvited > event.details.inviteCount) {
      return res.status(400).json({
        success: false,
        error: { message: `تجاوز العدد المسموح. المتبقي: ${event.details.inviteCount - currentInvited} دعوة` }
      });
    }

    // Add guest
    const newGuest = {
      name: guestData.name,
      phone: guestData.phone, // Keep the full international format
      numberOfAccompanyingGuests: guestData.numberOfAccompanyingGuests,
      whatsappMessageSent: false,
      addedAt: new Date(),
      updatedAt: new Date()
    };

    event.guests.push(newGuest);
    await event.save();

    logger.info(`Guest added to event ${id} for user ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'تم إضافة الضيف بنجاح',
      guest: event.guests[event.guests.length - 1],
      remainingInvites: event.details.inviteCount - newTotalInvited
    });

  } catch (error) {
    logger.error('Error adding guest:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إضافة الضيف' }
    });
  }
});

/**
 * PATCH /api/events/:id/guests/:guestId
 * Update guest information
 */
router.patch('/:id/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, guestId } = req.params;

    // Validate request body
    const validationResult = updateGuestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const updateData = validationResult.data;

    const event = await Event.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // For VIP packages, check if guest list is already confirmed
    if (event.packageType === 'vip' && event.guestListConfirmed.isConfirmed) {
      return res.status(400).json({
        success: false,
        error: { message: 'تم تأكيد قائمة الضيوف مسبقاً. لا يمكن تعديل قائمة الضيوف' }
      });
    }

    const guestIndex = event.guests.findIndex(guest => guest._id?.toString() === guestId);
    if (guestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { message: 'الضيف غير موجود' }
      });
    }

    const guest = event.guests[guestIndex];

    // Update fields
    if (updateData.name) guest.name = updateData.name;
    if (updateData.phone) guest.phone = updateData.phone; // Keep the full international format
    if (updateData.numberOfAccompanyingGuests) {
      // Check invite limit when updating guest count
      const otherGuestsTotal = event.guests
        .filter((_, idx) => idx !== guestIndex)
        .reduce((sum, g) => sum + g.numberOfAccompanyingGuests, 0);
      
      const newTotal = otherGuestsTotal + updateData.numberOfAccompanyingGuests;
      
      if (newTotal > event.details.inviteCount) {
        return res.status(400).json({
          success: false,
          error: { message: `تجاوز العدد المسموح. الحد الأقصى: ${event.details.inviteCount}` }
        });
      }
      
      guest.numberOfAccompanyingGuests = updateData.numberOfAccompanyingGuests;
    }

    guest.updatedAt = new Date();
    await event.save();

    return res.json({
      success: true,
      message: 'تم تحديث بيانات الضيف بنجاح',
      guest
    });

  } catch (error) {
    logger.error('Error updating guest:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث بيانات الضيف' }
    });
  }
});

/**
 * POST /api/events/:id/guests/confirm
 * Confirm final guest list for VIP packages
 */
router.post('/:id/guests/confirm', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const event = await Event.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // Only allow for VIP packages
    if (event.packageType !== 'vip') {
      return res.status(400).json({
        success: false,
        error: { message: 'تأكيد قائمة الضيوف متاح فقط لحزم VIP' }
      });
    }

    // Check if already confirmed
    if (event.guestListConfirmed.isConfirmed) {
      return res.status(400).json({
        success: false,
        error: { message: 'تم تأكيد قائمة الضيوف مسبقاً' }
      });
    }

    // Check if there are guests to confirm
    if (event.guests.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'لا يمكن تأكيد قائمة فارغة' }
      });
    }

    // Confirm the guest list
    event.guestListConfirmed = {
      isConfirmed: true,
      confirmedAt: new Date(),
      confirmedBy: new Types.ObjectId(userId)
    };

    await event.save();

    logger.info(`Guest list confirmed for event ${id} by user ${userId}`);

    return res.json({
      success: true,
      message: 'تم تأكيد قائمة الضيوف بنجاح. سيتم إرسال الدعوات قريباً',
      data: {
        confirmedAt: event.guestListConfirmed.confirmedAt,
        guestCount: event.guests.length
      }
    });

  } catch (error) {
    logger.error('Error confirming guest list:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تأكيد قائمة الضيوف' }
    });
  }
});

/**
 * DELETE /api/events/:id/guests/:guestId
 * Remove guest from event
 */
router.delete('/:id/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, guestId } = req.params;

    const event = await Event.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // For VIP packages, check if guest list is already confirmed
    if (event.packageType === 'vip' && event.guestListConfirmed.isConfirmed) {
      return res.status(400).json({
        success: false,
        error: { message: 'تم تأكيد قائمة الضيوف مسبقاً. لا يمكن تعديل قائمة الضيوف' }
      });
    }

    const initialLength = event.guests.length;
    event.guests = event.guests.filter(guest => guest._id?.toString() !== guestId);

    if (event.guests.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: { message: 'الضيف غير موجود' }
      });
    }

    await event.save();

    return res.json({
      success: true,
      message: 'تم حذف الضيف بنجاح',
      remainingGuests: event.guests.length
    });

  } catch (error) {
    logger.error('Error removing guest:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في حذف الضيف' }
    });
  }
});

/**
 * POST /api/events/:id/guests/:guestId/whatsapp
 * Mark WhatsApp message as sent for a guest
 */
router.post('/:id/guests/:guestId/whatsapp', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, guestId } = req.params;

    const event = await Event.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    const guest = event.guests.find(g => g._id?.toString() === guestId);
    if (!guest) {
      return res.status(404).json({
        success: false,
        error: { message: 'الضيف غير موجود' }
      });
    }

    guest.whatsappMessageSent = true;
    guest.updatedAt = new Date();
    await event.save();

    return res.json({
      success: true,
      message: 'تم تحديث حالة إرسال رسالة واتساب',
      guest
    });

  } catch (error) {
    logger.error('Error updating WhatsApp status:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث حالة الرسالة' }
    });
  }
});

/**
 * PATCH /api/events/:id/status
 * Update event status (only allow upcoming -> cancelled)
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    // Only allow manual cancellation
    if (status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        error: { message: 'يمكن إلغاء المناسبات فقط يدوياً' }
      });
    }

    const event = await Event.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(id), 
        userId: new Types.ObjectId(userId),
        status: 'upcoming' // Only allow cancelling upcoming events
      },
      { 
        status: 'cancelled',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة أو لا يمكن إلغاؤها' }
      });
    }

    logger.info(`Event cancelled by user ${userId}, event: ${id}`);

    return res.json({
      success: true,
      message: 'تم إلغاء المناسبة بنجاح',
      event
    });

  } catch (error) {
    logger.error('Error updating event status:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث حالة المناسبة' }
    });
  }
});

/**
 * GET /api/events/stats
 * Get user's event statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const stats = await Event.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPrice: { $sum: '$totalPrice' }
        }
      }
    ]);

    const formattedStats = {
      upcoming: 0,
      cancelled: 0,
      done: 0,
      total_revenue: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id as keyof typeof formattedStats] = stat.count;
      if (stat._id !== 'cancelled') {
        formattedStats.total_revenue += stat.totalPrice;
      }
    });

    return res.json({
      success: true,
      stats: formattedStats
    });

  } catch (error) {
    logger.error('Error fetching event stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب إحصائيات المناسبات' }
    });
  }
});

export default router;