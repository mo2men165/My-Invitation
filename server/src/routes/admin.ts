// server/src/routes/admin.ts
import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireAdmin } from '../middleware/auth';
import { Types } from 'mongoose';
import { NotificationService } from '../services/notificationService';
import { AdminNotification } from '../models/AdminNotification';
import { emailService } from '../services/emailService';


const router = Router();

// Apply admin authentication to all routes
router.use(checkJwt, extractUser, requireAdmin);

// ============================================
// DASHBOARD & STATS
// ============================================

/**
 * GET /api/admin/dashboard/stats
 * Admin dashboard overview statistics
 */
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Current month range
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Get counts
    const [
      totalUsers,
      totalEvents,
      pendingApprovals,
      approvedEvents,
      rejectedEvents,
      monthlyRevenue,
      activeUsers,
      suspendedUsers
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ approvalStatus: 'pending' }),
      Event.countDocuments({ approvalStatus: 'approved' }),
      Event.countDocuments({ approvalStatus: 'rejected' }),
      Event.aggregate([
        {
          $match: {
            paymentCompletedAt: { $gte: startOfMonth, $lte: endOfMonth },
            approvalStatus: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' })
    ]);

    const revenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;

    return res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers
        },
        events: {
          total: totalEvents,
          pendingApprovals,
          approved: approvedEvents,
          rejected: rejectedEvents
        },
        revenue: {
          thisMonth: revenue
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching admin dashboard stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب إحصائيات لوحة التحكم' }
    });
  }
});

// ============================================
// EVENT APPROVAL MANAGEMENT
// ============================================

/**
 * GET /api/admin/events/pending
 * Get events pending approval
 */
router.get('/events/pending', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find({ approvalStatus: 'pending' })
      .populate('userId', 'firstName lastName email phone city')
      .sort({ paymentCompletedAt: 1 }) // Oldest first
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Event.countDocuments({ approvalStatus: 'pending' });

    const formattedEvents = events.map(event => {
      // For VIP packages, only show guests if list is confirmed
      const guestsToShow = event.packageType === 'vip' && !event.guestListConfirmed?.isConfirmed 
        ? [] 
        : event.guests || [];

      return {
        id: event._id,
        user: {
          name: `${(event.userId as any).firstName} ${(event.userId as any).lastName}`,
          email: (event.userId as any).email,
          phone: (event.userId as any).phone,
          city: (event.userId as any).city
        },
        eventDetails: {
          hostName: event.details.hostName,
          eventDate: event.details.eventDate,
          eventLocation: event.details.eventLocation,
          inviteCount: event.details.inviteCount,
          packageType: event.packageType
        },
        totalPrice: event.totalPrice,
        paymentCompletedAt: event.paymentCompletedAt,
        status: event.status,
        guests: guestsToShow,
        guestListConfirmed: event.guestListConfirmed,
        // Show guest count for VIP packages even if not confirmed
        guestCount: event.guests?.length || 0
      };
    });

    return res.json({
      success: true,
      data: {
        events: formattedEvents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching pending events:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب الأحداث المعلقة' }
    });
  }
});

/**
 * GET /api/admin/events/all
 * Get all events with filtering
 */
router.get('/events/all', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      approvalStatus = '', 
      status = '',
      search = ''
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    // Build query
    const query: any = {};
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'details.hostName': { $regex: search, $options: 'i' } },
        { 'details.eventLocation': { $regex: search, $options: 'i' } }
      ];
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('userId', 'firstName lastName email phone')
        .populate('approvedBy', 'firstName lastName')
        .sort({ paymentCompletedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Event.countDocuments(query)
    ]);

    const formattedEvents = events.map(event => {
      // For VIP packages, only show guests if list is confirmed
      const guestsToShow = event.packageType === 'vip' && !event.guestListConfirmed?.isConfirmed 
        ? [] 
        : event.guests || [];

      return {
        id: event._id,
        user: {
          name: `${(event.userId as any).firstName} ${(event.userId as any).lastName}`,
          email: (event.userId as any).email,
          phone: (event.userId as any).phone
        },
        eventDetails: {
          hostName: event.details.hostName,
          eventDate: event.details.eventDate,
          eventLocation: event.details.eventLocation,
          inviteCount: event.details.inviteCount,
          packageType: event.packageType
        },
        totalPrice: event.totalPrice,
        status: event.status,
        approvalStatus: event.approvalStatus,
        adminNotes: event.adminNotes,
        approvedBy: event.approvedBy ? `${(event.approvedBy as any).firstName} ${(event.approvedBy as any).lastName}` : null,
        approvedAt: event.approvedAt,
        rejectedAt: event.rejectedAt,
        paymentCompletedAt: event.paymentCompletedAt,
        guests: guestsToShow,
        guestListConfirmed: event.guestListConfirmed,
        // Show guest count for VIP packages even if not confirmed
        guestCount: event.guests?.length || 0
      };
    });

    return res.json({
      success: true,
      data: {
        events: formattedEvents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching all events:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب الأحداث' }
    });
  }
});

/**
 * POST /api/admin/events/:eventId/approve
 * Approve an event
 */
router.post('/events/:eventId/approve', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { notes, invitationCardUrl } = req.body;
    const adminId = req.user!.id;

    // Validate Google Drive URL if provided
    if (invitationCardUrl && !invitationCardUrl.includes('drive.google.com') && !invitationCardUrl.includes('docs.google.com')) {
      return res.status(400).json({
        success: false,
        error: { message: 'يجب أن يكون رابط البطاقة من Google Drive' }
      });
    }

    const event = await Event.findById(eventId).populate('userId', 'email firstName lastName');
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'الحدث غير موجود' }
      });
    }

    if (event.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'الحدث ليس في انتظار الموافقة' }
      });
    }

    // Update event approval status
    event.approvalStatus = 'approved';
    event.approvedBy = new Types.ObjectId(adminId);
    event.approvedAt = new Date();
    if (notes) event.adminNotes = notes;
    if (invitationCardUrl) event.invitationCardUrl = invitationCardUrl;

    await event.save();

    // Send approval email to user
    const user = event.userId as any;
    try {
      await emailService.sendEventApprovalEmail({
        name: user.firstName,
        email: user.email,
        eventName: event.details.hostName,
        eventDate: event.details.eventDate.toLocaleDateString('ar-SA'),
        invitationCardUrl: event.invitationCardUrl
      });
      
      logger.info(`Approval email sent to user ${user.email} for event ${eventId}`);
    } catch (emailError) {
      logger.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    logger.info(`Event ${eventId} approved by admin ${adminId}`);

    return res.json({
      success: true,
      message: 'تم الموافقة على الحدث وإرسال إشعار للمستخدم'
    });

  } catch (error) {
    logger.error('Error approving event:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في الموافقة على الحدث' }
    });
  }
});

/**
 * POST /api/admin/events/:eventId/reject
 * Reject an event
 */
router.post('/events/:eventId/reject', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    if (!notes) {
      return res.status(400).json({
        success: false,
        error: { message: 'سبب الرفض مطلوب' }
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'الحدث غير موجود' }
      });
    }

    if (event.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'الحدث ليس في انتظار الموافقة' }
      });
    }

    // Update event approval status
    event.approvalStatus = 'rejected';
    event.approvedBy = new Types.ObjectId(adminId);
    event.rejectedAt = new Date();
    event.adminNotes = notes;

    await event.save();

    logger.info(`Event ${eventId} rejected by admin ${adminId}`);

    return res.json({
      success: true,
      message: 'تم رفض الحدث'
    });

  } catch (error) {
    logger.error('Error rejecting event:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في رفض الحدث' }
    });
  }
});

/**
 * POST /api/admin/events/bulk-approve
 * Bulk approve multiple events
 */
router.post('/events/bulk-approve', async (req: Request, res: Response) => {
  try {
    const { eventIds, notes } = req.body;
    const adminId = req.user!.id;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'قائمة الأحداث مطلوبة' }
      });
    }

    const updateData: any = {
      approvalStatus: 'approved',
      approvedBy: new Types.ObjectId(adminId),
      approvedAt: new Date()
    };

    if (notes) updateData.adminNotes = notes;

    const result = await Event.updateMany(
      { 
        _id: { $in: eventIds },
        approvalStatus: 'pending'
      },
      updateData
    );

    logger.info(`Bulk approved ${result.modifiedCount} events by admin ${adminId}`);

    return res.json({
      success: true,
      message: `تم الموافقة على ${result.modifiedCount} حدث بنجاح`,
      approvedCount: result.modifiedCount
    });

  } catch (error) {
    logger.error('Error bulk approving events:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في الموافقة الجماعية' }
    });
  }
});

// ============================================
// EVENT GUEST MANAGEMENT
// ============================================

/**
 * GET /api/admin/events/:eventId/guests
 * Get all guests for a specific event (admin only)
 */
router.get('/events/:eventId/guests', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('userId', 'firstName lastName email phone')
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // For VIP packages, only show guests if list is confirmed
    const guestsToShow = event.packageType === 'vip' && !event.guestListConfirmed?.isConfirmed 
      ? [] 
      : event.guests || [];

    // Calculate guest statistics based on actual guests shown
    const totalInvited = guestsToShow.reduce((sum, guest) => sum + guest.numberOfAccompanyingGuests, 0);
    const whatsappSent = guestsToShow.filter(guest => guest.whatsappMessageSent).length;

    return res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          hostName: event.details.hostName,
          eventDate: event.details.eventDate,
          eventLocation: event.details.eventLocation,
          packageType: event.packageType,
          invitationText: event.details.invitationText,
          startTime: event.details.startTime,
          endTime: event.details.endTime,
          user: {
            name: `${(event.userId as any).firstName} ${(event.userId as any).lastName}`,
            email: (event.userId as any).email,
            phone: (event.userId as any).phone
          },
          guestListConfirmed: event.guestListConfirmed
        },
        guests: guestsToShow,
        guestStats: {
          totalGuests: guestsToShow.length,
          totalInvited,
          whatsappMessagesSent: whatsappSent,
          remainingInvites: event.details.inviteCount - totalInvited,
          // Show actual guest count for VIP packages even if not confirmed
          actualGuestCount: event.guests?.length || 0
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching event guests:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب ضيوف المناسبة' }
    });
  }
});

/**
 * POST /api/admin/events/:eventId/guests/:guestId/whatsapp
 * Mark WhatsApp message as sent for a guest (admin only)
 */
router.post('/events/:eventId/guests/:guestId/whatsapp', async (req: Request, res: Response) => {
  try {
    const { eventId, guestId } = req.params;
    const adminId = req.user!.id;

    const event = await Event.findById(eventId);
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

    logger.info(`Admin ${adminId} marked WhatsApp as sent for guest ${guestId} in event ${eventId}`);

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

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      status = '' 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;
    if (status) query.status = status;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    // Get event counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const eventCount = await Event.countDocuments({ userId: user._id });
        return {
          ...user,
          eventCount
        };
      })
    );

    return res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب المستخدمين' }
    });
  }
});

/**
 * PUT /api/admin/users/:userId/status
 * Update user status (active/suspended)
 */
router.put('/users/:userId/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const adminId = req.user!.id;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'حالة غير صحيحة' }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Prevent admins from suspending themselves
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: { message: 'لا يمكن تعديل حالة حسابك الخاص' }
      });
    }

    user.status = status;
    await user.save();

    logger.info(`User ${userId} status changed to ${status} by admin ${adminId}`);

    return res.json({
      success: true,
      message: `تم ${status === 'active' ? 'تفعيل' : 'تعليق'} الحساب بنجاح`
    });

  } catch (error) {
    logger.error('Error updating user status:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث حالة المستخدم' }
    });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Update user role (user/admin)
 */
router.put('/users/:userId/role', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user!.id;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: 'دور غير صحيح' }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    user.role = role;
    await user.save();

    logger.info(`User ${userId} role changed to ${role} by admin ${adminId}`);

    return res.json({
      success: true,
      message: `تم تغيير الدور إلى ${role === 'admin' ? 'مدير' : 'مستخدم'} بنجاح`
    });

  } catch (error) {
    logger.error('Error updating user role:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث دور المستخدم' }
    });
  }
});

/**
 * GET /api/admin/notifications
 * Get admin notifications
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const adminId = req.user!.id;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (unreadOnly === 'true') {
      // For unread only, check if current admin hasn't read it
      query.readBy = { $nin: [new Types.ObjectId(adminId)] };
    }

    const notifications = await AdminNotification.find(query)
      .populate('eventId', 'details.hostName details.eventDate')
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Mark each notification with individual read status for this admin
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification,
      isRead: notification.readBy.some((readBy: any) => 
        readBy.toString() === adminId
      )
    }));

    const total = await AdminNotification.countDocuments(query);
    const unreadCount = await AdminNotification.countDocuments({ 
      readBy: { $nin: [new Types.ObjectId(adminId)] } 
    });

    return res.json({
      success: true,
      data: {
        notifications: notificationsWithReadStatus,
        unreadCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب الإشعارات' }
    });
  }
});

/**
 * POST /api/admin/notifications/:id/read
 * Mark notification as read
 */
router.post('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await NotificationService.markAsRead(id, adminId);

    return res.json({
      success: true,
      message: 'تم تحديث حالة الإشعار'
    });

  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث الإشعار' }
    });
  }
});

export default router;