// server/src/routes/admin.ts
import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireAdmin } from '../middleware/auth';
import { withDB } from '../utils/routeUtils';
import { Types } from 'mongoose';
import { NotificationService } from '../services/notificationService';
import { AdminNotification } from '../models/AdminNotification';
import { emailService } from '../services/emailService';
import { uploadSingleImage } from '../config/multer';
import { CloudinaryService, WHATSAPP_VIDEO_MAX_BYTES } from '../services/cloudinaryService';
import { registerTabbyWebhook, updateTabbyWebhook } from '../services/tabbyWebhookRegistration';
import { PackageImage } from '../models/PackageImage';
// Imported statically, not via await import(): tsc emits CommonJS locally while
// @vercel/node emits ESM, and a runtime import() is resolved by Node's ESM resolver
// in both cases - which requires a file extension that only matches one of the two
// build layouts. A static import is rewritten by each compiler and works in both.
import { OrderService } from '../services/orderService';
import { WhatsappService } from '../services/whatsappService';
import { getGuestCards, getInvitationSize, getMissingCardCount, hasAllCards } from '../utils/guestCards';
import { phoneValidationSchema, normalizePhoneNumber } from '../utils/phoneValidation';
import { z } from 'zod';

// Upload signatures are only ever issued for our own media folders, so a
// signature cannot be turned into a write anywhere else in the Cloudinary account.
const ALLOWED_UPLOAD_FOLDERS = /^(events\/[a-f0-9]{24}\/(invitation-cards|guests\/[a-f0-9]{24}\/invites)|packages)$/;

// What the browser sends back after uploading straight to Cloudinary.
const uploadedMediaSchema = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  url: z.string().url(),
  format: z.string().optional().default(''),
  width: z.number().optional().default(0),
  height: z.number().optional().default(0),
  bytes: z.number().optional().default(0),
  created_at: z.string().optional().default(() => new Date().toISOString()),
  resource_type: z.enum(['image', 'video']).optional().default('image'),
  duration: z.number().optional(),
  whatsapp_url: z.string().url().optional(),
  whatsapp_bytes: z.number().optional()
});

/**
 * A video card is only usable if Cloudinary produced a WhatsApp-safe rendition
 * and that rendition fits inside Meta's 16MB ceiling. Without this check the
 * card saves fine and every invitation later fails with error 131053.
 */
function rejectUnsendableVideo(media: z.infer<typeof uploadedMediaSchema>, res: Response): boolean {
  if (media.resource_type !== 'video') {
    return false;
  }

  if (!media.whatsapp_url) {
    res.status(400).json({
      success: false,
      error: { message: 'تعذر تجهيز نسخة الفيديو المتوافقة مع الواتساب. يرجى المحاولة مرة أخرى' }
    });
    return true;
  }

  if (media.whatsapp_bytes && media.whatsapp_bytes > WHATSAPP_VIDEO_MAX_BYTES) {
    const sizeMb = (media.whatsapp_bytes / 1024 / 1024).toFixed(1);
    res.status(400).json({
      success: false,
      error: {
        message: `الفيديو كبير جداً بعد المعالجة (${sizeMb} ميجابايت). الحد الأقصى للواتساب 16 ميجابايت، يرجى استخدام مقطع أقصر`
      }
    });
    return true;
  }

  return false;
}

// Same shape the customer-facing add-guest endpoint accepts.
const adminGuestSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneValidationSchema,
  numberOfAccompanyingGuests: z.number().int().min(1).max(10)
});


const router = Router();

// Apply admin authentication to all routes
router.use(checkJwt, extractUser, requireAdmin);

/**
 * Calculate effective total invited guests (excluding declined guests that were refunded)
 */
function calculateEffectiveTotalInvited(guests: any[]): number {
  return guests.reduce((sum, guest) => {
    // If guest declined and was refunded, don't count them
    if (guest.rsvpStatus === 'declined' && guest.refundedOnDecline) {
      return sum;
    }
    return sum + guest.numberOfAccompanyingGuests;
  }, 0);
}

// ============================================
// DASHBOARD & STATS
// ============================================

/**
 * GET /api/admin/dashboard/stats
 * Admin dashboard overview statistics
 */
router.get('/dashboard/stats', withDB(async (req: Request, res: Response) => {
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
      suspendedUsers,
      eventsWithCollaborators,
      totalCollaborations,
      collaboratorInvitedUsers
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
      User.countDocuments({ status: 'suspended' }),
      Event.countDocuments({ 'collaborators.0': { $exists: true } }),
      Event.aggregate([
        { $unwind: '$collaborators' },
        { $count: 'total' }
      ]),
      User.countDocuments({ accountOrigin: 'collaborator_invited' })
    ]);

    const revenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;
    const totalCollaborationsCount = totalCollaborations.length > 0 ? totalCollaborations[0].total : 0;

    return res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          collaboratorInvited: collaboratorInvitedUsers
        },
        events: {
          total: totalEvents,
          pendingApprovals,
          approved: approvedEvents,
          rejected: rejectedEvents,
          withCollaborators: eventsWithCollaborators
        },
        revenue: {
          thisMonth: revenue
        },
        collaboration: {
          eventsWithCollaborators,
          totalCollaborations: totalCollaborationsCount,
          collaboratorInvitedUsers,
          conversionRate: totalUsers > 0 ? Math.round((collaboratorInvitedUsers / totalUsers) * 100) : 0
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
}));

// ============================================
// EVENT APPROVAL MANAGEMENT
// ============================================

/**
 * GET /api/admin/events/pending
 * Get events pending approval
 */
router.get('/events/pending', withDB(async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find({ approvalStatus: 'pending' })
      .populate('userId', 'firstName lastName email phone city')
      .populate('collaborators.userId', 'firstName lastName email')
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

      // Format guests with added by information
      const formattedGuests = guestsToShow.map(guest => ({
        ...guest,
        addedByInfo: guest.addedBy ? {
          type: guest.addedBy.type,
          isOwner: guest.addedBy.type === 'owner',
          isCollaborator: guest.addedBy.type === 'collaborator',
          collaboratorEmail: guest.addedBy.collaboratorEmail
        } : {
          type: 'owner', // Default for existing guests
          isOwner: true,
          isCollaborator: false
        }
      }));

      // Format collaborators
      const collaborators = event.collaborators?.map(collab => ({
        id: (collab.userId as any)?._id,
        name: (collab.userId as any) ? `${(collab.userId as any).firstName} ${(collab.userId as any).lastName}` : 'Unknown',
        email: (collab.userId as any)?.email,
        allocatedInvites: collab.allocatedInvites,
        usedInvites: collab.usedInvites,
        permissions: collab.permissions,
        addedAt: collab.addedAt
      })) || [];

      return {
        id: event._id,
        user: {
          name: `${(event.userId as any).firstName} ${(event.userId as any).lastName}`,
          email: (event.userId as any).email,
          phone: (event.userId as any).phone,
          city: (event.userId as any).city
        },
        eventDetails: {
          eventName: event.details.eventName,
          hostName: event.details.hostName,
          eventDate: event.details.eventDate,
          eventLocation: event.details.eventLocation,
          displayName: event.details.displayName,
          inviteCount: event.details.inviteCount,
          packageType: event.packageType,
          startTime: event.details.startTime,
          endTime: event.details.endTime,
          invitationText: event.details.invitationText,
          additionalCards: event.details.additionalCards,
          gateSupervisors: event.details.gateSupervisors,
          fastDelivery: event.details.fastDelivery,
          formattedAddress: event.details.formattedAddress,
          googleMapsUrl: event.details.googleMapsUrl,
          detectedCity: event.details.detectedCity,
          isCustomDesign: event.details.isCustomDesign,
          customDesignNotes: event.details.customDesignNotes
        },
        designId: event.designId,
        totalPrice: event.totalPrice,
        paymentCompletedAt: event.paymentCompletedAt,
        status: event.status,
        approvalStatus: event.approvalStatus,
        adminNotes: event.adminNotes,
        invitationCardImage: event.invitationCardImage,
        qrCodeReaderUrl: event.qrCodeReaderUrl,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        guests: formattedGuests,
        guestListConfirmed: event.guestListConfirmed,
        classicInvitationsDelivered: event.classicInvitationsDelivered,
        // Show guest count for VIP packages even if not confirmed
        guestCount: event.guests?.length || 0,
        
        // Collaboration information
        hasCollaborators: collaborators.length > 0,
        collaborators,
        collaborationStats: {
          totalCollaborators: collaborators.length,
          totalAllocatedInvites: event.totalAllocatedInvites || 0,
          guestsAddedByOwner: formattedGuests.filter(g => g.addedByInfo.isOwner).length,
          guestsAddedByCollaborators: formattedGuests.filter(g => g.addedByInfo.isCollaborator).length
        }
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
}));

/**
 * GET /api/admin/events/all
 * Get all events with filtering
 */
router.get('/events/all', withDB(async (req: Request, res: Response) => {
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
        .populate('collaborators.userId', 'firstName lastName email')
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

      // Format guests with added by information
      const formattedGuests = guestsToShow.map(guest => ({
        ...guest,
        addedByInfo: guest.addedBy ? {
          type: guest.addedBy.type,
          isOwner: guest.addedBy.type === 'owner',
          isCollaborator: guest.addedBy.type === 'collaborator',
          collaboratorEmail: guest.addedBy.collaboratorEmail
        } : {
          type: 'owner', // Default for existing guests
          isOwner: true,
          isCollaborator: false
        }
      }));

      // Format collaborators
      const collaborators = event.collaborators?.map(collab => ({
        id: (collab.userId as any)?._id,
        name: (collab.userId as any) ? `${(collab.userId as any).firstName} ${(collab.userId as any).lastName}` : 'Unknown',
        email: (collab.userId as any)?.email,
        allocatedInvites: collab.allocatedInvites,
        usedInvites: collab.usedInvites,
        permissions: collab.permissions,
        addedAt: collab.addedAt
      })) || [];

      return {
        id: event._id,
        user: {
          name: `${(event.userId as any).firstName} ${(event.userId as any).lastName}`,
          email: (event.userId as any).email,
          phone: (event.userId as any).phone
        },
        eventDetails: {
          eventName: event.details.eventName,
          hostName: event.details.hostName,
          eventDate: event.details.eventDate,
          eventLocation: event.details.eventLocation,
          displayName: event.details.displayName,
          inviteCount: event.details.inviteCount,
          packageType: event.packageType,
          startTime: event.details.startTime,
          endTime: event.details.endTime,
          invitationText: event.details.invitationText,
          additionalCards: event.details.additionalCards,
          gateSupervisors: event.details.gateSupervisors,
          fastDelivery: event.details.fastDelivery,
          formattedAddress: event.details.formattedAddress,
          googleMapsUrl: event.details.googleMapsUrl,
          detectedCity: event.details.detectedCity,
          isCustomDesign: event.details.isCustomDesign,
          customDesignNotes: event.details.customDesignNotes
        },
        designId: event.designId,
        totalPrice: event.totalPrice,
        status: event.status,
        approvalStatus: event.approvalStatus,
        adminNotes: event.adminNotes,
        approvedBy: event.approvedBy ? `${(event.approvedBy as any).firstName} ${(event.approvedBy as any).lastName}` : null,
        approvedAt: event.approvedAt,
        rejectedAt: event.rejectedAt,
        paymentCompletedAt: event.paymentCompletedAt,
        invitationCardImage: event.invitationCardImage,
        qrCodeReaderUrl: event.qrCodeReaderUrl,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        guests: formattedGuests,
        guestListConfirmed: event.guestListConfirmed,
        classicInvitationsDelivered: event.classicInvitationsDelivered,
        // Show guest count for VIP packages even if not confirmed
        guestCount: event.guests?.length || 0,
        
        // Collaboration information
        hasCollaborators: collaborators.length > 0,
        collaborators,
        collaborationStats: {
          totalCollaborators: collaborators.length,
          totalAllocatedInvites: event.totalAllocatedInvites || 0,
          guestsAddedByOwner: formattedGuests.filter(g => g.addedByInfo.isOwner).length,
          guestsAddedByCollaborators: formattedGuests.filter(g => g.addedByInfo.isCollaborator).length
        }
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
}));

/**
 * POST /api/admin/events/:eventId/approve
 * Approve an event with invitation card image upload
 */
router.post('/events/:eventId/approve', uploadSingleImage, withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const { notes, qrCodeReaderUrl } = req.body;
    const adminId = req.user!.id;
    const file = req.file;

    const event = await Event.findById(eventIdString).populate('userId', 'email firstName lastName');
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

    // Validate and upload invitation card image if provided
    let invitationCardImage = null;
    if (file) {
      // Validate the image file
      const validation = CloudinaryService.validateImageFile(file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: { message: validation.error || 'صورة غير صالحة' }
        });
      }

      try {
        // Upload to Cloudinary
        const uploadResult = await CloudinaryService.uploadFile(
          file.buffer,
          file.originalname,
          {
            folder: `events/${eventId}/invitation-cards`,
            resource_type: 'image'
          }
        );

        invitationCardImage = {
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          url: uploadResult.url,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          created_at: uploadResult.created_at
        };

        // Delete old image if it exists
        if (event.invitationCardImage?.public_id) {
          try {
            await CloudinaryService.deleteImage(event.invitationCardImage.public_id);
          } catch (deleteError) {
            logger.warn('Failed to delete old invitation card image:', deleteError);
            // Don't fail the request if deletion fails
          }
        }
      } catch (uploadError: any) {
        logger.error('Error uploading invitation card image:', uploadError);
        return res.status(500).json({
          success: false,
          error: { message: `فشل رفع الصورة: ${uploadError.message}` }
        });
      }
    } else if (req.body?.media) {
      // Large cards and every video are uploaded straight to Cloudinary by the
      // browser, which posts the resulting metadata here instead of the file.
      const parsed = uploadedMediaSchema.safeParse(
        typeof req.body.media === 'string' ? JSON.parse(req.body.media) : req.body.media
      );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: { message: 'بيانات الملف المرفوع غير صالحة' }
        });
      }

      if (rejectUnsendableVideo(parsed.data, res)) {
        return;
      }

      invitationCardImage = parsed.data;

      if (event.invitationCardImage?.public_id) {
        try {
          await CloudinaryService.deleteImage(
            event.invitationCardImage.public_id,
            event.invitationCardImage.resource_type
          );
        } catch (deleteError) {
          logger.warn('Failed to delete old invitation card:', deleteError);
        }
      }
    } else {
      // If no image provided, return error (image is now required)
      return res.status(400).json({
        success: false,
        error: { message: 'يجب رفع بطاقة الدعوة' }
      });
    }

    // Update event approval status
    event.approvalStatus = 'approved';
    event.approvedBy = new Types.ObjectId(adminId);
    event.approvedAt = new Date();
    if (notes) event.adminNotes = notes;
    if (invitationCardImage) event.invitationCardImage = invitationCardImage;
    if (qrCodeReaderUrl) event.qrCodeReaderUrl = qrCodeReaderUrl;

    await event.save();

    // Send approval email to user
    const user = event.userId as any;
    try {
      await emailService.sendEventApprovalEmail({
        name: user.firstName,
        email: user.email,
        eventName: event.details.eventName || event.details.hostName,
        eventDate: event.details.eventDate.toLocaleDateString('ar-SA', { calendar: 'gregory' }),
        invitationCardUrl: event.invitationCardImage?.secure_url || event.invitationCardImage?.url,
        qrCodeReaderUrl: event.qrCodeReaderUrl
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
}));

/**
 * POST /api/admin/events/:eventId/reject
 * Reject an event
 */
router.post('/events/:eventId/reject', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const { notes } = req.body;
    const adminId = req.user!.id;

    if (!notes) {
      return res.status(400).json({
        success: false,
        error: { message: 'سبب الرفض مطلوب' }
      });
    }

    const event = await Event.findById(eventIdString);
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
}));

/**
 * POST /api/admin/uploads/signature
 * Hand the browser a signed, short-lived permission to upload one file straight
 * to Cloudinary. Invitation cards can be videos, and a serverless request body
 * is capped at 4.5MB on Vercel, so large files cannot be relayed through here.
 */
router.post('/uploads/signature', withDB(async (req: Request, res: Response) => {
  try {
    const { folder, resourceType } = req.body ?? {};

    if (typeof folder !== 'string' || !ALLOWED_UPLOAD_FOLDERS.test(folder)) {
      return res.status(400).json({
        success: false,
        error: { message: 'مسار الرفع غير صالح' }
      });
    }

    if (resourceType !== 'image' && resourceType !== 'video') {
      return res.status(400).json({
        success: false,
        error: { message: 'نوع الملف غير مدعوم' }
      });
    }

    const signature = CloudinaryService.generateUploadSignature(folder, resourceType);

    return res.json({ success: true, data: signature });
  } catch (error) {
    logger.error('Error generating upload signature:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تجهيز الرفع' }
    });
  }
}));

/**
 * PUT /api/admin/events/:eventId/image
 * Update event invitation card image (can create if not exists or update if exists)
 */
router.put('/events/:eventId/image', uploadSingleImage, withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;
    const file = req.file;

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'الحدث غير موجود' }
      });
    }

    // The browser uploads large files, and every video, straight to Cloudinary
    // and posts the resulting metadata here instead of the file itself.
    if (!file && req.body?.media) {
      const parsed = uploadedMediaSchema.safeParse(req.body.media);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: { message: 'بيانات الملف المرفوع غير صالحة' }
        });
      }

      if (rejectUnsendableVideo(parsed.data, res)) {
        return;
      }

      const previousPublicId = event.invitationCardImage?.public_id;
      const previousResourceType = event.invitationCardImage?.resource_type;

      event.invitationCardImage = parsed.data;
      await event.save();

      if (previousPublicId && previousPublicId !== parsed.data.public_id) {
        try {
          await CloudinaryService.deleteImage(previousPublicId, previousResourceType);
        } catch (deleteError) {
          logger.warn('Failed to delete old invitation card:', deleteError);
        }
      }

      logger.info(`Event ${eventId} invitation card updated by admin ${adminId}`, {
        resourceType: parsed.data.resource_type
      });

      return res.json({
        success: true,
        message: 'تم تحديث بطاقة الدعوة بنجاح',
        data: { invitationCardImage: event.invitationCardImage }
      });
    }

    // If no file provided, return error
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: 'يجب رفع صورة' }
      });
    }

    // Validate the image file
    const validation = CloudinaryService.validateImageFile(file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error || 'صورة غير صالحة' }
      });
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadFile(
        file.buffer,
        file.originalname,
        {
          folder: `events/${eventId}/invitation-cards`,
          resource_type: 'image'
        }
      );

      const invitationCardImage = {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        url: uploadResult.url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        created_at: uploadResult.created_at
      };

      // Delete old image if it exists
      if (event.invitationCardImage?.public_id) {
        try {
          await CloudinaryService.deleteImage(event.invitationCardImage.public_id);
        } catch (deleteError) {
          logger.warn('Failed to delete old invitation card image:', deleteError);
          // Don't fail the request if deletion fails
        }
      }

      // Update event with new image (creates field if not exists, updates if exists)
      event.invitationCardImage = invitationCardImage;
      await event.save();

      logger.info(`Event ${eventId} invitation card image updated by admin ${adminId}`);

      return res.json({
        success: true,
        message: 'تم تحديث صورة بطاقة الدعوة بنجاح',
        data: {
          invitationCardImage
        }
      });

    } catch (uploadError: any) {
      logger.error('Error uploading invitation card image:', uploadError);
      return res.status(500).json({
        success: false,
        error: { message: `فشل رفع الصورة: ${uploadError.message}` }
      });
    }

  } catch (error) {
    logger.error('Error updating event image:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث صورة الحدث' }
    });
  }
}));

/**
 * POST /api/admin/events/bulk-approve
 * Bulk approve multiple events
 */
router.post('/events/bulk-approve', withDB(async (req: Request, res: Response) => {
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
}));

// ============================================
// EVENT GUEST MANAGEMENT
// ============================================

/**
 * GET /api/admin/events/:eventId/guests
 * Get all guests for a specific event (admin only)
 */
router.get('/events/:eventId/guests', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;

    const event = await Event.findById(eventIdString)
      .populate('userId', 'firstName lastName email phone')
      .populate('collaborators.userId', 'firstName lastName email')
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

    // Format guests with added by information
    const formattedGuests = guestsToShow.map(guest => ({
      ...guest,
      // A guest's invitation needs one entry card per person it covers.
      cardsRequired: getInvitationSize(guest),
      cardsUploaded: getGuestCards(guest).length,
      addedByInfo: guest.addedBy ? {
        type: guest.addedBy.type,
        isOwner: guest.addedBy.type === 'owner',
        isCollaborator: guest.addedBy.type === 'collaborator',
        collaboratorEmail: guest.addedBy.collaboratorEmail
      } : {
        type: 'owner', // Default for existing guests
        isOwner: true,
        isCollaborator: false
      }
    }));

    // Format collaborators
    const collaborators = event.collaborators?.map(collab => ({
      id: (collab.userId as any)?._id,
      name: (collab.userId as any) ? `${(collab.userId as any).firstName} ${(collab.userId as any).lastName}` : 'Unknown',
      email: (collab.userId as any)?.email,
      allocatedInvites: collab.allocatedInvites,
      usedInvites: collab.usedInvites,
      permissions: collab.permissions,
      addedAt: collab.addedAt
    })) || [];

    // Calculate guest statistics based on actual guests shown
    // Use effective total (excluding declined refundable guests)
    const totalInvited = calculateEffectiveTotalInvited(guestsToShow);
    const whatsappSent = guestsToShow.filter(guest => guest.whatsappMessageSent).length;
    const guestsAddedByOwner = formattedGuests.filter(g => g.addedByInfo.isOwner).length;
    const guestsAddedByCollaborators = formattedGuests.filter(g => g.addedByInfo.isCollaborator).length;

    return res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          eventName: event.details.eventName,
          hostName: event.details.hostName,
          eventDate: event.details.eventDate,
          eventLocation: event.details.eventLocation,
          displayName: event.details.displayName,
          packageType: event.packageType,
          invitationText: event.details.invitationText,
          startTime: event.details.startTime,
          endTime: event.details.endTime,
          inviteCount: event.details.inviteCount,
          invitationCardUrl: event.invitationCardImage?.secure_url || event.invitationCardImage?.url,
          user: {
            name: `${(event.userId as any).firstName} ${(event.userId as any).lastName}`,
            email: (event.userId as any).email,
            phone: (event.userId as any).phone
          },
          guestListConfirmed: event.guestListConfirmed,
          classicInvitationsDelivered: event.classicInvitationsDelivered,
          
          // Collaboration information
          hasCollaborators: collaborators.length > 0,
          collaborators,
          collaborationStats: {
            totalCollaborators: collaborators.length,
            totalAllocatedInvites: event.totalAllocatedInvites || 0
          }
        },
        guests: formattedGuests,
        guestStats: {
          totalGuests: guestsToShow.length,
          totalInvited,
          whatsappMessagesSent: whatsappSent,
          remainingInvites: event.details.inviteCount - totalInvited,
          // Show actual guest count for VIP packages even if not confirmed
          actualGuestCount: event.guests?.length || 0,
          
          // Collaboration guest stats
          guestsAddedByOwner,
          guestsAddedByCollaborators,
          guestsByCollaborator: collaborators.map(collab => ({
            collaboratorName: collab.name,
            collaboratorEmail: collab.email,
            guestsAdded: formattedGuests.filter(g => 
              g.addedByInfo.isCollaborator && g.addedByInfo.collaboratorEmail === collab.email
            ).length
          }))
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
}));

/**
 * POST /api/admin/events/:eventId/guests
 * Add a guest to a premium/VIP event on the customer's behalf. Unlike the
 * customer-facing endpoint this one also works once the guest list is confirmed,
 * since an admin adding a guest is a deliberate act rather than an edit the
 * customer slipped in after locking the list.
 */
router.post('/events/:eventId/guests', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;

    const validationResult = adminGuestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const guestData = validationResult.data;

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    if (event.packageType !== 'premium' && event.packageType !== 'vip') {
      return res.status(400).json({
        success: false,
        error: { message: 'إضافة الضيوف متاحة فقط لباقات Premium و VIP' }
      });
    }

    const phone = normalizePhoneNumber(guestData.phone);

    if (event.guests.some(guest => guest.phone === phone)) {
      return res.status(400).json({
        success: false,
        error: { message: 'هذا الضيف موجود بالفعل' }
      });
    }

    // Same capacity rule as the customer-facing endpoint: declined guests whose
    // slots were refunded do not count against the package.
    const currentInvited = calculateEffectiveTotalInvited(event.guests);
    const remaining = event.details.inviteCount - currentInvited;

    if (guestData.numberOfAccompanyingGuests > remaining) {
      return res.status(400).json({
        success: false,
        error: { message: `تجاوز العدد المسموح. المتبقي: ${remaining} دعوة` }
      });
    }

    event.guests.push({
      name: guestData.name,
      phone,
      numberOfAccompanyingGuests: guestData.numberOfAccompanyingGuests,
      whatsappMessageSent: false,
      addedAt: new Date(),
      updatedAt: new Date(),
      addedBy: {
        type: 'admin',
        userId: new Types.ObjectId(adminId)
      }
    } as any);

    await event.save();

    const addedGuest = event.guests[event.guests.length - 1];

    logger.info(`Admin ${adminId} added guest to event ${eventId}`, {
      guestName: guestData.name,
      people: guestData.numberOfAccompanyingGuests
    });

    return res.status(201).json({
      success: true,
      message: 'تم إضافة الضيف بنجاح',
      data: {
        guest: addedGuest,
        remainingInvites: event.details.inviteCount - calculateEffectiveTotalInvited(event.guests)
      }
    });

  } catch (error) {
    logger.error('Error adding guest as admin:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إضافة الضيف' }
    });
  }
}));

/**
 * POST /api/admin/events/:eventId/guests/:guestId/whatsapp
 * Mark WhatsApp message as sent for a guest (admin only)
 */
router.post('/events/:eventId/guests/:guestId/whatsapp', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId, guestId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;

    const event = await Event.findById(eventIdString);
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
}));

/**
 * PUT /api/admin/events/:eventId/guests/:guestId/invite-image[/:slot]
 * Set or remove one of a guest's entry cards (premium and VIP packages only).
 *
 * A guest's invitation covers numberOfAccompanyingGuests people, so it needs
 * that many cards: slot 0 is the guest's own card and slots 1..n-1 belong to the
 * accompanying guests. Omitting the slot targets slot 0, which is what the
 * single-card version of this endpoint used to do.
 */
router.put(
  [
    '/events/:eventId/guests/:guestId/invite-image',
    '/events/:eventId/guests/:guestId/invite-image/:slot'
  ],
  uploadSingleImage,
  withDB(async (req: Request, res: Response) => {
  try {
    const { eventId, guestId, slot } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;
    const file = req.file;

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // Check if package type is premium or VIP
    if (event.packageType !== 'premium' && event.packageType !== 'vip') {
      return res.status(400).json({
        success: false,
        error: { message: 'صور الدعوة الفردية متاحة فقط لباقات Premium و VIP' }
      });
    }

    const guest = event.guests.find(g => g._id?.toString() === guestId);
    if (!guest) {
      return res.status(404).json({
        success: false,
        error: { message: 'الضيف غير موجود' }
      });
    }

    const slotIndex = Number(Array.isArray(slot) ? slot[0] : slot ?? 0);
    const invitationSize = getInvitationSize(guest);

    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= invitationSize) {
      return res.status(400).json({
        success: false,
        error: { message: `رقم البطاقة غير صحيح. هذه الدعوة تحتاج ${invitationSize} بطاقة` }
      });
    }

    // Start from whatever is on file, including the older single-image shape.
    const cards = getGuestCards(guest);
    const replacedCard = cards[slotIndex];

    // Cards are stored densely - slot n is the nth card - so a slot can only be
    // filled once the ones before it are, and removing one shifts the rest down.
    if ((req.file || req.body?.media) && slotIndex > cards.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'يجب إضافة البطاقات بالترتيب' }
      });
    }

    const persist = async () => {
      // Trailing empty slots are dropped so a card count always reflects reality.
      while (cards.length > 0 && !cards[cards.length - 1]) {
        cards.pop();
      }

      guest.individualInviteImages = cards.length > 0 ? cards : undefined;
      // Keep the legacy single field pointing at the guest's own card.
      guest.individualInviteImage = cards[0];
      guest.updatedAt = new Date();
      event.markModified('guests');
      await event.save();
    };

    const removeReplacedImage = async () => {
      if (!replacedCard?.public_id) {
        return;
      }
      try {
        await CloudinaryService.deleteImage(replacedCard.public_id);
      } catch (deleteError) {
        logger.warn('Failed to delete old guest invite image:', deleteError);
        // Don't fail the request if deletion fails
      }
    };

    // The browser uploads straight to Cloudinary and posts the metadata here,
    // since a serverless request body is capped at 4.5MB on Vercel.
    if (req.body?.media) {
      const parsed = uploadedMediaSchema.safeParse(req.body.media);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: { message: 'بيانات الملف المرفوع غير صالحة' }
        });
      }

      await removeReplacedImage();

      cards[slotIndex] = parsed.data;
      await persist();

      logger.info(`Admin ${adminId} updated invite card ${slotIndex} for guest ${guestId} in event ${eventId}`);

      return res.json({
        success: true,
        message: 'تم تحديث صورة الدعوة بنجاح',
        data: { guest }
      });
    }

    // If no file provided, delete the card in this slot
    if (!file) {
      await removeReplacedImage();

      // Slots after this one shift down, so the remaining cards stay contiguous.
      cards.splice(slotIndex, 1);
      await persist();

      logger.info(`Admin ${adminId} removed invite card ${slotIndex} for guest ${guestId} in event ${eventId}`);

      return res.json({
        success: true,
        message: 'تم حذف صورة الدعوة بنجاح',
        data: { guest }
      });
    }

    // Validate the image file
    const validation = CloudinaryService.validateImageFile(file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error || 'صورة غير صالحة' }
      });
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadFile(
        file.buffer,
        file.originalname,
        {
          folder: `events/${eventId}/guests/${guestId}/invites`,
          resource_type: 'image'
        }
      );

      const uploadedCard = {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        url: uploadResult.url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        created_at: uploadResult.created_at
      };

      await removeReplacedImage();

      cards[slotIndex] = uploadedCard;
      await persist();

      logger.info(`Admin ${adminId} updated invite card ${slotIndex} for guest ${guestId} in event ${eventId}`);

      return res.json({
        success: true,
        message: 'تم تحديث صورة الدعوة بنجاح',
        data: { guest }
      });
    } catch (uploadError: any) {
      logger.error('Error uploading guest invite image:', uploadError);
      return res.status(500).json({
        success: false,
        error: { message: `فشل رفع الصورة: ${uploadError.message}` }
      });
    }

  } catch (error) {
    logger.error('Error updating guest invite image:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث صورة الدعوة' }
    });
  }
}));

/**
 * POST /api/admin/events/:eventId/reopen-guest-list
 * Reopen guest list for users after confirmation (all package types)
 */
router.post('/events/:eventId/reopen-guest-list', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // Check if guest list was confirmed
    if (!event.guestListConfirmed.isConfirmed) {
      return res.status(400).json({
        success: false,
        error: { message: 'قائمة الضيوف لم يتم تأكيدها بعد' }
      });
    }

    // Reopen the guest list
    const currentReopenCount = event.guestListConfirmed.reopenCount || 0;
    event.guestListConfirmed = {
      isConfirmed: false,
      confirmedAt: event.guestListConfirmed.confirmedAt,
      confirmedBy: event.guestListConfirmed.confirmedBy,
      reopenedAt: new Date(),
      reopenedBy: new Types.ObjectId(adminId),
      reopenCount: currentReopenCount + 1
    };

    await event.save();

    logger.info(`Admin ${adminId} reopened guest list for event ${eventId} (reopen count: ${currentReopenCount + 1})`);

    return res.json({
      success: true,
      message: 'تم إعادة فتح قائمة الضيوف بنجاح',
      data: {
        reopenedAt: event.guestListConfirmed.reopenedAt,
        reopenCount: event.guestListConfirmed.reopenCount
      }
    });

  } catch (error) {
    logger.error('Error reopening guest list:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إعادة فتح قائمة الضيوف' }
    });
  }
}));

/**
 * POST /api/admin/events/:eventId/classic-invitations-delivered
 * Mark (or unmark) the invitation cards of a classic event as handed to the
 * customer. Classic events have no guest list, so delivery is tracked once per
 * event rather than per guest.
 */
router.post('/events/:eventId/classic-invitations-delivered', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;
    const delivered = req.body?.delivered !== false;

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    if (event.packageType !== 'classic') {
      return res.status(400).json({
        success: false,
        error: { message: 'هذا الإجراء متاح للباقة الكلاسيكية فقط' }
      });
    }

    event.classicInvitationsDelivered = delivered
      ? {
          isDelivered: true,
          deliveredAt: new Date(),
          deliveredBy: new Types.ObjectId(adminId)
        }
      : { isDelivered: false };

    await event.save();

    logger.info(
      `Admin ${adminId} marked classic invitations for event ${eventId} as ${delivered ? 'delivered' : 'not delivered'}`
    );

    return res.json({
      success: true,
      message: delivered
        ? 'تم تسجيل تسليم الدعوات للعميل'
        : 'تم إلغاء تسجيل تسليم الدعوات',
      data: { classicInvitationsDelivered: event.classicInvitationsDelivered }
    });

  } catch (error) {
    logger.error('Error updating classic invitation delivery status:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث حالة تسليم الدعوات' }
    });
  }
}));

/**
 * PUT /api/admin/events/:eventId/guests/:guestId/attendance
 * Mark guest attendance (VIP packages only - post-event)
 */
router.put('/events/:eventId/guests/:guestId/attendance', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId, guestId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const { attended } = req.body;
    const adminId = req.user!.id;

    if (typeof attended !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { message: 'حالة الحضور يجب أن تكون true أو false' }
      });
    }

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // Check if package type is VIP
    if (event.packageType !== 'vip') {
      return res.status(400).json({
        success: false,
        error: { message: 'تتبع الحضور متاح فقط لباقات VIP' }
      });
    }

    const guest = event.guests.find(g => g._id?.toString() === guestId);
    if (!guest) {
      return res.status(404).json({
        success: false,
        error: { message: 'الضيف غير موجود' }
      });
    }

    // Update attendance
    guest.actuallyAttended = attended;
    guest.attendanceMarkedAt = new Date();
    guest.attendanceMarkedBy = new Types.ObjectId(adminId);
    guest.updatedAt = new Date();
    
    await event.save();

    logger.info(`Admin ${adminId} marked attendance for guest ${guestId} in event ${eventId}: ${attended}`);

    return res.json({
      success: true,
      message: attended ? 'تم تسجيل حضور الضيف' : 'تم تسجيل عدم حضور الضيف',
      data: { guest }
    });

  } catch (error) {
    logger.error('Error marking guest attendance:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تسجيل الحضور' }
    });
  }
}));

/**
 * POST /api/admin/events/:eventId/send-invitations
 * Send invitations to guests of a premium/VIP event, one chunk per request.
 * The caller repeats the request with the returned remainingGuestIds until the
 * list is empty; guests already marked as sent are skipped when no explicit
 * guestIds are given.
 */
router.post('/events/:eventId/send-invitations', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;
    const { guestIds, limit } = req.body ?? {};

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    if (event.packageType !== 'premium' && event.packageType !== 'vip') {
      return res.status(400).json({
        success: false,
        error: { message: 'إرسال الدعوات عبر الواتساب متاح فقط لباقات Premium و VIP' }
      });
    }

    if (!event.guestListConfirmed?.isConfirmed) {
      return res.status(400).json({
        success: false,
        error: { message: 'لم يتم تأكيد قائمة الضيوف بعد' }
      });
    }

    const recipientIds: string[] = Array.isArray(guestIds) && guestIds.length > 0
      ? guestIds
      : event.guests.filter(g => !g.whatsappMessageSent).map(g => g._id!.toString());

    // Every person on an invitation needs a card before it can go out.
    const guestsMissingCards = event.guests.filter(
      g => recipientIds.includes(g._id!.toString()) && !hasAllCards(g)
    );

    if (guestsMissingCards.length > 0) {
      const missingTotal = guestsMissingCards.reduce((sum, g) => sum + getMissingCardCount(g), 0);
      return res.status(400).json({
        success: false,
        error: {
          message: `${guestsMissingCards.length} ضيف بحاجة إلى صور دعوات (${missingTotal} بطاقة ناقصة) قبل الإرسال`
        }
      });
    }

    if (recipientIds.length === 0) {
      return res.json({
        success: true,
        message: 'تم إرسال الدعوات لجميع الضيوف مسبقاً',
        data: { success: true, sent: 0, failed: 0, results: [], remainingGuestIds: [] }
      });
    }

    const result = await WhatsappService.sendBulkInvitations(eventIdString, recipientIds, limit);

    logger.info(`Admin ${adminId} sent invitations chunk for event ${eventId}`, {
      sent: result.sent,
      failed: result.failed,
      remaining: result.remainingGuestIds.length
    });

    return res.json({
      success: true,
      message: `تم إرسال ${result.sent} دعوة`,
      data: result
    });

  } catch (error) {
    logger.error('Error sending invitations:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إرسال الدعوات' }
    });
  }
}));

/**
 * POST /api/admin/events/:eventId/send-reminders
 * Send reminder messages to all confirmed guests (Premium: 3 days, VIP: 5 days)
 */
router.post('/events/:eventId/send-reminders', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // Only for Premium and VIP packages
    if (event.packageType !== 'premium' && event.packageType !== 'vip') {
      return res.status(400).json({
        success: false,
        error: { message: 'التذكيرات متاحة فقط لباقات Premium و VIP' }
      });
    }

    const { guestIds, limit } = req.body ?? {};
    const result = await WhatsappService.sendEventReminders(eventIdString, guestIds, limit);

    logger.info(`Admin ${adminId} sent reminders chunk for event ${eventId}`, {
      sent: result.sent,
      failed: result.failed,
      remaining: result.remainingGuestIds.length
    });

    return res.json({
      success: true,
      message: result.sent > 0
        ? `تم إرسال ${result.sent} تذكير`
        : 'لا يوجد ضيوف مؤكدين لإرسال التذكيرات لهم',
      data: result
    });

  } catch (error) {
    logger.error('Error sending reminders:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إرسال التذكيرات' }
    });
  }
}));

/**
 * POST /api/admin/events/:eventId/send-thank-you
 * Send thank you messages to all attended guests (VIP only - after event)
 */
router.post('/events/:eventId/send-thank-you', withDB(async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId;
    const adminId = req.user!.id;

    const event = await Event.findById(eventIdString);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    // Only for VIP packages
    if (event.packageType !== 'vip') {
      return res.status(400).json({
        success: false,
        error: { message: 'رسائل الشكر متاحة فقط لباقات VIP' }
      });
    }

    const { guestIds, limit } = req.body ?? {};
    const result = await WhatsappService.sendThankYouMessages(eventIdString, guestIds, limit);

    logger.info(`Admin ${adminId} sent thank you chunk for event ${eventId}`, {
      sent: result.sent,
      failed: result.failed,
      remaining: result.remainingGuestIds.length
    });

    return res.json({
      success: true,
      message: result.sent > 0
        ? `تم إرسال ${result.sent} رسالة شكر`
        : 'لا يوجد ضيوف حضروا لإرسال رسائل الشكر لهم',
      data: result
    });

  } catch (error) {
    logger.error('Error sending thank you messages:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إرسال رسائل الشكر' }
    });
  }
}));

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 */
router.get('/users', withDB(async (req: Request, res: Response) => {
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

    // Get event counts and collaboration stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const [eventCount, collaboratedEventCount, collaborationsCreated] = await Promise.all([
          Event.countDocuments({ userId: user._id }),
          Event.countDocuments({ 'collaborators.userId': user._id }),
          Event.countDocuments({ 
            userId: user._id, 
            'collaborators.0': { $exists: true } 
          })
        ]);

        const { _id, ...userWithoutId } = user;
        return {
          ...userWithoutId,
          id: _id.toString(),
          eventCount,
          collaborationStats: {
            collaboratedIn: collaboratedEventCount,
            collaborationsCreated,
            isCollaboratorInvited: user.accountOrigin === 'collaborator_invited'
          }
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
}));

/**
 * PUT /api/admin/users/:userId/status
 * Update user status (active/suspended)
 */
router.put('/users/:userId/status', withDB(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const { status } = req.body;
    const adminId = req.user!.id;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'حالة غير صحيحة' }
      });
    }

    const user = await User.findById(userIdString);
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
}));

/**
 * PUT /api/admin/users/:userId/role
 * Update user role (user/admin)
 */
router.put('/users/:userId/role', withDB(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const { role } = req.body;
    const adminId = req.user!.id;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: 'دور غير صحيح' }
      });
    }

    const user = await User.findById(userIdString);
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
}));

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * GET /api/admin/orders
 * Get all orders with filtering and pagination
 */
router.get('/orders', withDB(async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    // Build query
    const query: any = {};
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { merchantOrderId: { $regex: search, $options: 'i' } },
        { paymobOrderId: Number(search) || -1 }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'firstName lastName email phone city')
        .populate('eventsCreated', 'details.eventName details.hostName approvalStatus')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      id: order._id,
      merchantOrderId: order.merchantOrderId,
      paymobOrderId: order.paymobOrderId,
      paymobTransactionId: order.paymobTransactionId,
      user: {
        id: (order.userId as any)?._id,
        name: `${(order.userId as any)?.firstName} ${(order.userId as any)?.lastName}`,
        email: (order.userId as any)?.email,
        phone: (order.userId as any)?.phone,
        city: (order.userId as any)?.city
      },
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      itemsCount: order.selectedCartItems.length,
      eventsCreated: order.eventsCreated.length,
      eventsDetails: (order.eventsCreated as any[])?.map(event => ({
        id: event._id,
        name: event.details?.hostName || event.details?.eventName,
        approvalStatus: event.approvalStatus
      })) || [],
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      failedAt: order.failedAt,
      cancelledAt: order.cancelledAt
    }));

    // Get status counts for statistics
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const stats = {
      pending: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    statusCounts.forEach(stat => {
      stats[stat._id as keyof typeof stats] = stat.count;
      if (stat._id === 'completed') {
        stats.totalRevenue = stat.totalAmount;
      }
    });

    return res.json({
      success: true,
      data: {
        orders: formattedOrders,
        stats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب الطلبات' }
    });
  }
}));

/**
 * GET /api/admin/orders/:orderId
 * Get detailed information about a specific order
 */
router.get('/orders/:orderId', withDB(async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const orderIdString = Array.isArray(orderId) ? orderId[0] : orderId;

    const order = await Order.findById(orderIdString)
      .populate('userId', 'firstName lastName email phone city')
      .populate('eventsCreated')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'الطلب غير موجود' }
      });
    }

    // Format order details
    const formattedOrder = {
      id: order._id,
      merchantOrderId: order.merchantOrderId,
      paymobOrderId: order.paymobOrderId,
      paymobTransactionId: order.paymobTransactionId,
      user: {
        id: (order.userId as any)?._id,
        name: `${(order.userId as any)?.firstName} ${(order.userId as any)?.lastName}`,
        email: (order.userId as any)?.email,
        phone: (order.userId as any)?.phone,
        city: (order.userId as any)?.city
      },
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      selectedCartItems: order.selectedCartItems.map(item => ({
        cartItemId: item.cartItemId,
        packageType: item.cartItemData.packageType,
        eventName: item.cartItemData.details.eventName,
        hostName: item.cartItemData.details.hostName,
        eventDate: item.cartItemData.details.eventDate,
        eventLocation: item.cartItemData.details.eventLocation,
        inviteCount: item.cartItemData.details.inviteCount,
        totalPrice: item.cartItemData.totalPrice,
        isCustomDesign: item.cartItemData.details.isCustomDesign,
        customDesignNotes: item.cartItemData.details.customDesignNotes
      })),
      eventsCreated: (order.eventsCreated as any[])?.map(event => ({
        id: event._id,
        eventName: event.details?.eventName,
        hostName: event.details?.hostName,
        eventDate: event.details?.eventDate,
        approvalStatus: event.approvalStatus,
        status: event.status,
        packageType: event.packageType,
        guestCount: event.guests?.length || 0
      })) || [],
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      failedAt: order.failedAt,
      cancelledAt: order.cancelledAt
    };

    return res.json({
      success: true,
      data: formattedOrder
    });

  } catch (error) {
    logger.error('Error fetching order details:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب تفاصيل الطلب' }
    });
  }
}));

/**
 * POST /api/admin/orders/:orderId/complete
 * Manually mark order as completed and create events
 */
router.post('/orders/:orderId/complete', withDB(async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const orderIdString = Array.isArray(orderId) ? orderId[0] : orderId;
    const { transactionId } = req.body;
    const adminId = req.user!.id;

    const order = await Order.findById(orderIdString);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'الطلب غير موجود' }
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: `الطلب ليس في حالة الانتظار. الحالة الحالية: ${order.status}` }
      });
    }

    // Process the order manually using the same logic as webhook
    const result = await OrderService.processSuccessfulPayment(
      order.merchantOrderId,
      transactionId || `ADMIN_MANUAL_${Date.now()}`
    );

    if (result.success) {
      logger.info(`Admin ${adminId} manually completed order ${orderId}`, {
        orderId,
        adminId,
        eventsCreated: result.eventsCreated,
        merchantOrderId: order.merchantOrderId
      });

      return res.json({
        success: true,
        message: 'تم تأكيد الطلب وإنشاء الأحداث بنجاح',
        data: {
          eventsCreated: result.eventsCreated,
          orderId: result.orderId
        }
      });
    } else {
      logger.error(`Admin ${adminId} failed to complete order ${orderId}: ${result.error}`);
      return res.status(500).json({
        success: false,
        error: { message: result.error || 'فشل في معالجة الطلب' }
      });
    }

  } catch (error) {
    logger.error('Error manually completing order:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تأكيد الطلب' }
    });
  }
}));

/**
 * POST /api/admin/orders/:orderId/fail
 * Manually mark order as failed
 */
router.post('/orders/:orderId/fail', withDB(async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const orderIdString = Array.isArray(orderId) ? orderId[0] : orderId;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const order = await Order.findById(orderIdString);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'الطلب غير موجود' }
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: `الطلب ليس في حالة الانتظار. الحالة الحالية: ${order.status}` }
      });
    }

    order.status = 'failed';
    order.failedAt = new Date();
    if (reason) {
      order.adminNotes = reason;
    }
    await order.save();

    logger.info(`Admin ${adminId} manually failed order ${orderId}`, {
      orderId,
      adminId,
      reason,
      merchantOrderId: order.merchantOrderId
    });

    return res.json({
      success: true,
      message: 'تم تحديد الطلب كفاشل'
    });

  } catch (error) {
    logger.error('Error manually failing order:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث حالة الطلب' }
    });
  }
}));

/**
 * POST /api/admin/orders/:orderId/cancel
 * Manually cancel order
 */
router.post('/orders/:orderId/cancel', withDB(async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const orderIdString = Array.isArray(orderId) ? orderId[0] : orderId;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const order = await Order.findById(orderIdString);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'الطلب غير موجود' }
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: 'لا يمكن إلغاء طلب مكتمل' }
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    if (reason) {
      order.adminNotes = reason;
    }
    await order.save();

    logger.info(`Admin ${adminId} cancelled order ${orderId}`, {
      orderId,
      adminId,
      reason,
      merchantOrderId: order.merchantOrderId
    });

    return res.json({
      success: true,
      message: 'تم إلغاء الطلب'
    });

  } catch (error) {
    logger.error('Error cancelling order:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إلغاء الطلب' }
    });
  }
}));

/**
 * GET /api/admin/collaboration/analytics
 * Get detailed collaboration analytics
 */
router.get('/collaboration/analytics', withDB(async (req: Request, res: Response) => {
  try {
    // Get collaboration statistics
    const [
      eventsWithCollaborators,
      totalCollaborations,
      collaboratorInvitedUsers,
      packageBreakdown,
      topCollaborators,
      recentCollaborations
    ] = await Promise.all([
      // Events with collaborators
      Event.countDocuments({ 'collaborators.0': { $exists: true } }),
      
      // Total collaborations count
      Event.aggregate([
        { $unwind: '$collaborators' },
        { $count: 'total' }
      ]),
      
      // Users invited as collaborators
      User.countDocuments({ accountOrigin: 'collaborator_invited' }),
      
      // Collaboration breakdown by package type
      Event.aggregate([
        { $match: { 'collaborators.0': { $exists: true } } },
        {
          $group: {
            _id: '$packageType',
            count: { $sum: 1 },
            totalCollaborators: { $sum: { $size: '$collaborators' } }
          }
        }
      ]),
      
      // Top collaborators (most active)
      Event.aggregate([
        { $unwind: '$collaborators' },
        {
          $group: {
            _id: '$collaborators.userId',
            eventsCollaborated: { $sum: 1 },
            totalInvitesUsed: { $sum: '$collaborators.usedInvites' }
          }
        },
        { $sort: { eventsCollaborated: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' }
      ]),
      
      // Recent collaborations
      Event.aggregate([
        { $match: { 'collaborators.0': { $exists: true } } },
        { $unwind: '$collaborators' },
        { $sort: { 'collaborators.addedAt': -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'eventOwner'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'collaborators.userId',
            foreignField: '_id',
            as: 'collaboratorInfo'
          }
        },
        { $unwind: '$eventOwner' },
        { $unwind: '$collaboratorInfo' }
      ])
    ]);

    const totalCollaborationsCount = totalCollaborations.length > 0 ? totalCollaborations[0].total : 0;

    return res.json({
      success: true,
      data: {
        overview: {
          eventsWithCollaborators,
          totalCollaborations: totalCollaborationsCount,
          collaboratorInvitedUsers,
          averageCollaboratorsPerEvent: eventsWithCollaborators > 0 
            ? Math.round((totalCollaborationsCount / eventsWithCollaborators) * 10) / 10 
            : 0
        },
        packageBreakdown,
        topCollaborators: topCollaborators.map(collab => ({
          id: collab._id,
          name: `${collab.userInfo.firstName} ${collab.userInfo.lastName}`,
          email: collab.userInfo.email,
          eventsCollaborated: collab.eventsCollaborated,
          totalInvitesUsed: collab.totalInvitesUsed,
          accountOrigin: collab.userInfo.accountOrigin
        })),
        recentCollaborations: recentCollaborations.map(collab => ({
          eventId: collab._id,
          eventName: collab.details.hostName,
          eventDate: collab.details.eventDate,
          packageType: collab.packageType,
          owner: {
            name: `${collab.eventOwner.firstName} ${collab.eventOwner.lastName}`,
            email: collab.eventOwner.email
          },
          collaborator: {
            name: `${collab.collaboratorInfo.firstName} ${collab.collaboratorInfo.lastName}`,
            email: collab.collaboratorInfo.email,
            allocatedInvites: collab.collaborators.allocatedInvites,
            usedInvites: collab.collaborators.usedInvites
          },
          addedAt: collab.collaborators.addedAt
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching collaboration analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب تحليلات التعاون' }
    });
  }
}));

/**
 * GET /api/admin/notifications
 * Get admin notifications
 */
router.get('/notifications', withDB(async (req: Request, res: Response) => {
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
      .populate('eventId', 'details.eventName details.hostName details.eventDate details.displayName details.eventLocation packageType')
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
}));

/**
 * POST /api/admin/notifications/:id/read
 * Mark notification as read
 */
router.post('/notifications/:id/read', withDB(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idString = Array.isArray(id) ? id[0] : id;
    const adminId = req.user!.id;

    await NotificationService.markAsRead(idString, adminId);

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
}));

// ============================================
// USER CART MANAGEMENT
// ============================================

/**
 * GET /api/admin/users/:userId/cart
 * Get user's cart items (admin only)
 */
router.get('/users/:userId/cart', withDB(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdString = Array.isArray(userId) ? userId[0] : userId;

    if (!userIdString || userIdString === 'undefined') {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف المستخدم مطلوب' }
      });
    }

    // Validate MongoDB ObjectId format
    if (!Types.ObjectId.isValid(userIdString)) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف المستخدم غير صحيح' }
      });
    }

    const user = await User.findById(userIdString)
      .select('cart firstName lastName email')
      .populate('cart.adminPriceModifiedBy', 'firstName lastName')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        cart: user.cart || []
      }
    });

  } catch (error) {
    logger.error('Error fetching user cart:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب سلة المستخدم' }
    });
  }
}));

/**
 * PUT /api/admin/users/:userId/cart/:cartItemId/price
 * Update cart item price manually (admin only)
 */
router.put('/users/:userId/cart/:cartItemId/price', withDB(async (req: Request, res: Response) => {
  try {
    const { userId, cartItemId } = req.params;
    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const { price, reason } = req.body;
    const adminId = req.user!.id;

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'السعر يجب أن يكون رقم موجب' }
      });
    }

    const user = await User.findById(userIdString);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const cartItem = user.cart.find(item => item._id?.toString() === cartItemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: { message: 'العنصر غير موجود في السلة' }
      });
    }

    // Store original price if not already stored
    if (!cartItem.originalPrice) {
      cartItem.originalPrice = cartItem.totalPrice;
    }

    // Update price
    cartItem.adminModifiedPrice = price;
    cartItem.totalPrice = price;
    cartItem.adminPriceModifiedAt = new Date();
    cartItem.adminPriceModifiedBy = new Types.ObjectId(adminId);
    if (reason) {
      cartItem.priceModificationReason = reason;
    }
    cartItem.updatedAt = new Date();

    await user.save();


    logger.info(`Admin ${adminId} modified price for cart item ${cartItemId} of user ${userId} to ${price}`);

    return res.json({
      success: true,
      message: 'تم تحديث السعر بنجاح',
      data: {
        cartItem: cartItem
      }
    });

  } catch (error) {
    logger.error('Error updating cart item price:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث السعر' }
    });
  }
}));

/**
 * POST /api/admin/users/:userId/cart/:cartItemId/discount
 * Apply percentage discount to cart item (admin only)
 */
router.post('/users/:userId/cart/:cartItemId/discount', withDB(async (req: Request, res: Response) => {
  try {
    const { userId, cartItemId } = req.params;
    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const { percentage, reason } = req.body;
    const adminId = req.user!.id;

    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        error: { message: 'النسبة المئوية يجب أن تكون بين 0 و 100' }
      });
    }

    const user = await User.findById(userIdString);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const cartItem = user.cart.find(item => item._id?.toString() === cartItemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: { message: 'العنصر غير موجود في السلة' }
      });
    }

    // Store original price if not already stored
    if (!cartItem.originalPrice) {
      cartItem.originalPrice = cartItem.totalPrice;
    }

    // Calculate discounted price
    const discountAmount = (cartItem.originalPrice * percentage) / 100;
    const newPrice = Math.max(0, cartItem.originalPrice - discountAmount);

    // Update price
    cartItem.adminModifiedPrice = newPrice;
    cartItem.totalPrice = newPrice;
    cartItem.adminPriceModifiedAt = new Date();
    cartItem.adminPriceModifiedBy = new Types.ObjectId(adminId);
    if (reason) {
      cartItem.priceModificationReason = reason || `خصم ${percentage}%`;
    } else {
      cartItem.priceModificationReason = `خصم ${percentage}%`;
    }
    cartItem.updatedAt = new Date();

    await user.save();


    logger.info(`Admin ${adminId} applied ${percentage}% discount to cart item ${cartItemId} of user ${userId}`);

    return res.json({
      success: true,
      message: `تم تطبيق خصم ${percentage}% بنجاح`,
      data: {
        cartItem: cartItem,
        originalPrice: cartItem.originalPrice,
        discountAmount: discountAmount,
        newPrice: newPrice
      }
    });

  } catch (error) {
    logger.error('Error applying discount:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تطبيق الخصم' }
    });
  }
}));

/**
 * POST /api/admin/users/:userId/cart/discount-all
 * Apply percentage discount to all cart items (admin only)
 */
router.post('/users/:userId/cart/discount-all', withDB(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const { percentage, reason } = req.body;
    const adminId = req.user!.id;

    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        error: { message: 'النسبة المئوية يجب أن تكون بين 0 و 100' }
      });
    }

    const user = await User.findById(userIdString);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    if (user.cart.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'السلة فارغة' }
      });
    }

    const modifiedItems = [];
    for (const cartItem of user.cart) {
      // Store original price if not already stored
      if (!cartItem.originalPrice) {
        cartItem.originalPrice = cartItem.totalPrice;
      }

      // Calculate discounted price
      const discountAmount = (cartItem.originalPrice * percentage) / 100;
      const newPrice = Math.max(0, cartItem.originalPrice - discountAmount);

      // Update price
      cartItem.adminModifiedPrice = newPrice;
      cartItem.totalPrice = newPrice;
      cartItem.adminPriceModifiedAt = new Date();
      cartItem.adminPriceModifiedBy = new Types.ObjectId(adminId);
      if (reason) {
        cartItem.priceModificationReason = reason || `خصم ${percentage}%`;
      } else {
        cartItem.priceModificationReason = `خصم ${percentage}%`;
      }
      cartItem.updatedAt = new Date();

      modifiedItems.push({
        cartItemId: cartItem._id,
        originalPrice: cartItem.originalPrice,
        newPrice: newPrice,
        discountAmount: discountAmount
      });
    }

    await user.save();


    logger.info(`Admin ${adminId} applied ${percentage}% discount to all cart items of user ${userId}`);

    return res.json({
      success: true,
      message: `تم تطبيق خصم ${percentage}% على جميع العناصر بنجاح`,
      data: {
        modifiedItems: modifiedItems,
        totalItems: modifiedItems.length
      }
    });

  } catch (error) {
    logger.error('Error applying discount to all items:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تطبيق الخصم' }
    });
  }
}));

/**
 * DELETE /api/admin/users/:userId/cart/:cartItemId/price-modification
 * Remove admin price modification and restore original price (admin only)
 */
router.delete('/users/:userId/cart/:cartItemId/price-modification', withDB(async (req: Request, res: Response) => {
  try {
    const { userId, cartItemId } = req.params;
    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const adminId = req.user!.id;

    const user = await User.findById(userIdString);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    const cartItem = user.cart.find(item => item._id?.toString() === cartItemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: { message: 'العنصر غير موجود في السلة' }
      });
    }

    if (!cartItem.originalPrice) {
      return res.status(400).json({
        success: false,
        error: { message: 'لا يوجد تعديل سعر لإزالته' }
      });
    }

    // Restore original price
    cartItem.totalPrice = cartItem.originalPrice;
    cartItem.adminModifiedPrice = undefined;
    cartItem.adminPriceModifiedAt = undefined;
    cartItem.adminPriceModifiedBy = undefined;
    cartItem.priceModificationReason = undefined;
    cartItem.originalPrice = undefined;
    cartItem.updatedAt = new Date();

    await user.save();


    logger.info(`Admin ${adminId} removed price modification for cart item ${cartItemId} of user ${userId}`);

    return res.json({
      success: true,
      message: 'تم إعادة السعر الأصلي بنجاح',
      data: {
        cartItem: cartItem
      }
    });

  } catch (error) {
    logger.error('Error removing price modification:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إعادة السعر الأصلي' }
    });
  }
}));

// TEMPORARILY DISABLED - Tabby webhook management
if (false) {
// ============================================
// PAYMENT PROVIDER MANAGEMENT
// ============================================

/**
 * POST /api/admin/tabby/register-webhook
 * Manually register Tabby webhook (one-time operation)
 * Required for serverless environments where auto-registration doesn't work
 */
router.post('/tabby/register-webhook', withDB(async (req: Request, res: Response) => {
  try {
    const result = await registerTabbyWebhook();

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        webhookId: result.webhookId,
        webhookUrl: result.webhookUrl
      });
    } else {
      return res.status(400).json({
        success: false,
        error: { message: result.message }
      });
    }

  } catch (error: any) {
    logger.error('Error registering Tabby webhook:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في تسجيل webhook' }
    });
  }
}));

/**
 * PUT /api/admin/tabby/update-webhook/:webhookId
 * Update existing Tabby webhook URL
 */
router.put('/tabby/update-webhook/:webhookId', withDB(async (req: Request, res: Response) => {
  try {
    const webhookId = Array.isArray(req.params.webhookId) 
      ? req.params.webhookId[0] 
      : req.params.webhookId;
    
    if (!webhookId) {
      return res.status(400).json({
        success: false,
        error: { message: 'webhookId is required' }
      });
    }

    const result = await updateTabbyWebhook(webhookId);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        webhookId: result.webhookId,
        webhookUrl: result.webhookUrl
      });
    } else {
      return res.status(400).json({
        success: false,
        error: { message: result.message }
      });
    }

  } catch (error: any) {
    logger.error('Error updating Tabby webhook:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في تحديث webhook' }
    });
  }
}));

} // END TEMPORARILY DISABLED - Tabby webhook management

// ============================================
// PACKAGE IMAGE MANAGEMENT
// ============================================

/**
 * GET /api/admin/package-images
 * List package images, optionally filtered by packageTier or category
 */
router.get('/package-images', withDB(async (req: Request, res: Response) => {
  try {
    const { packageTier, category } = req.query;
    const filter: Record<string, string> = {};
    if (packageTier) filter.packageTier = packageTier as string;
    if (category) filter.category = category as string;

    const images = await PackageImage.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: images
    });
  } catch (error) {
    logger.error('Error fetching package images:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب صور الباقات' }
    });
  }
}));

/**
 * POST /api/admin/package-images
 * Upload a new package image (either package-tier tagged or event-category tagged)
 */
router.post('/package-images', uploadSingleImage, withDB(async (req: Request, res: Response) => {
  try {
    const adminId = req.user!.id;
    const file = req.file;
    const { name, packageTier, category } = req.body;

    if (!file && !req.body?.media) {
      return res.status(400).json({
        success: false,
        error: { message: 'الصورة مطلوبة' }
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'اسم التصميم مطلوب' }
      });
    }

    const hasTier = !!packageTier;
    const hasCategory = !!category;
    if (hasTier === hasCategory) {
      return res.status(400).json({
        success: false,
        error: { message: 'يجب تحديد إما نوع الباقة أو نوع المناسبة (وليس كلاهما)' }
      });
    }

    // The browser uploads straight to Cloudinary and posts the metadata here,
    // since a serverless request body is capped at 4.5MB on Vercel.
    let uploadResult;

    if (req.body?.media) {
      const parsed = uploadedMediaSchema.safeParse(req.body.media);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: { message: 'بيانات الملف المرفوع غير صالحة' }
        });
      }
      uploadResult = parsed.data;
    } else {
      const validation = CloudinaryService.validateImageFile(file!);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: { message: validation.error || 'صورة غير صالحة' }
        });
      }

      uploadResult = await CloudinaryService.uploadFile(
        file!.buffer,
        file!.originalname,
        { folder: 'packages', resource_type: 'image' }
      );
    }

    const packageImage = await PackageImage.create({
      name: name.trim(),
      image: uploadResult,
      packageTier: hasTier ? packageTier : undefined,
      category: hasCategory ? category : undefined
    });

    logger.info(`Admin ${adminId} created package image ${packageImage._id}`);

    return res.status(201).json({
      success: true,
      message: 'تم إضافة التصميم بنجاح',
      data: packageImage
    });
  } catch (error: any) {
    logger.error('Error creating package image:', error);
    return res.status(500).json({
      success: false,
      error: { message: `فشل إضافة التصميم: ${error.message}` }
    });
  }
}));

/**
 * PATCH /api/admin/package-images/:id
 * Rename or retag an existing package image
 */
router.patch('/package-images/:id', withDB(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, packageTier, category } = req.body;

    const packageImage = await PackageImage.findById(id);
    if (!packageImage) {
      return res.status(404).json({
        success: false,
        error: { message: 'التصميم غير موجود' }
      });
    }

    if (name !== undefined) packageImage.name = name.trim();
    if (packageTier !== undefined) {
      packageImage.packageTier = packageTier || undefined;
      packageImage.category = undefined;
    }
    if (category !== undefined) {
      packageImage.category = category || undefined;
      packageImage.packageTier = undefined;
    }

    await packageImage.save();

    return res.json({
      success: true,
      message: 'تم تحديث التصميم بنجاح',
      data: packageImage
    });
  } catch (error) {
    logger.error('Error updating package image:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث التصميم' }
    });
  }
}));

/**
 * DELETE /api/admin/package-images/:id
 * Remove a package image (Cloudinary + DB)
 */
router.delete('/package-images/:id', withDB(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const packageImage = await PackageImage.findById(id);
    if (!packageImage) {
      return res.status(404).json({
        success: false,
        error: { message: 'التصميم غير موجود' }
      });
    }

    try {
      await CloudinaryService.deleteImage(packageImage.image.public_id);
    } catch (deleteError) {
      logger.warn('Failed to delete package image from Cloudinary:', deleteError);
    }

    await packageImage.deleteOne();

    logger.info(`Admin ${adminId} deleted package image ${id}`);

    return res.json({
      success: true,
      message: 'تم حذف التصميم بنجاح'
    });
  } catch (error) {
    logger.error('Error deleting package image:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في حذف التصميم' }
    });
  }
}));

export default router;