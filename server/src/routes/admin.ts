// server/src/routes/admin.ts
import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireAdmin } from '../middleware/auth';
import { Types } from 'mongoose';
import { NotificationService } from '../services/notificationService';
import { AdminNotification } from '../models/AdminNotification';
import { emailService } from '../services/emailService';
import { uploadSingleImage } from '../config/multer';
import { CloudinaryService } from '../services/cloudinaryService';


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
});

/**
 * POST /api/admin/events/:eventId/approve
 * Approve an event with invitation card image upload
 */
router.post('/events/:eventId/approve', uploadSingleImage, async (req: Request, res: Response) => {
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
    } else {
      // If no image provided, return error (image is now required)
      return res.status(400).json({
        success: false,
        error: { message: 'يجب رفع صورة بطاقة الدعوة' }
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
});

/**
 * POST /api/admin/events/:eventId/reject
 * Reject an event
 */
router.post('/events/:eventId/reject', async (req: Request, res: Response) => {
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
});

/**
 * PUT /api/admin/events/:eventId/image
 * Update event invitation card image (can create if not exists or update if exists)
 */
router.put('/events/:eventId/image', uploadSingleImage, async (req: Request, res: Response) => {
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
          user: {
            name: `${(event.userId as any).firstName} ${(event.userId as any).lastName}`,
            email: (event.userId as any).email,
            phone: (event.userId as any).phone
          },
          guestListConfirmed: event.guestListConfirmed,
          
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
});

/**
 * POST /api/admin/events/:eventId/guests/:guestId/whatsapp
 * Mark WhatsApp message as sent for a guest (admin only)
 */
router.post('/events/:eventId/guests/:guestId/whatsapp', async (req: Request, res: Response) => {
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
});

/**
 * PUT /api/admin/events/:eventId/guests/:guestId/invite-image
 * Update individual invite image for a guest (premium and VIP packages only)
 */
router.put('/events/:eventId/guests/:guestId/invite-image', uploadSingleImage, async (req: Request, res: Response) => {
  try {
    const { eventId, guestId } = req.params;
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

    // If no file provided, delete the existing image
    if (!file) {
      // Delete old image if it exists
      if (guest.individualInviteImage?.public_id) {
        try {
          await CloudinaryService.deleteImage(guest.individualInviteImage.public_id);
        } catch (deleteError) {
          logger.warn('Failed to delete old guest invite image:', deleteError);
        }
      }
      
      // Remove the image field
      delete guest.individualInviteImage;
      guest.updatedAt = new Date();
      // Mark the guests array as modified so Mongoose saves the change
      event.markModified('guests');
      await event.save();

      logger.info(`Admin ${adminId} removed invite image for guest ${guestId} in event ${eventId}`);

      return res.json({
        success: true,
        message: 'تم حذف صورة الدعوة الفردية بنجاح',
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

      const individualInviteImage = {
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
      if (guest.individualInviteImage?.public_id) {
        try {
          await CloudinaryService.deleteImage(guest.individualInviteImage.public_id);
        } catch (deleteError) {
          logger.warn('Failed to delete old guest invite image:', deleteError);
          // Don't fail the request if deletion fails
        }
      }

      // Update the individual invite image
      guest.individualInviteImage = individualInviteImage;
      guest.updatedAt = new Date();
      await event.save();

      logger.info(`Admin ${adminId} updated invite image for guest ${guestId} in event ${eventId}`);

      return res.json({
        success: true,
        message: 'تم تحديث صورة الدعوة الفردية بنجاح',
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
});

/**
 * POST /api/admin/events/:eventId/reopen-guest-list
 * Reopen guest list for users after confirmation (all package types)
 */
router.post('/events/:eventId/reopen-guest-list', async (req: Request, res: Response) => {
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
});

/**
 * PUT /api/admin/events/:eventId/guests/:guestId/attendance
 * Mark guest attendance (VIP packages only - post-event)
 */
router.put('/events/:eventId/guests/:guestId/attendance', async (req: Request, res: Response) => {
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
});

/**
 * POST /api/admin/events/:eventId/send-reminders
 * Send reminder messages to all confirmed guests (Premium: 3 days, VIP: 5 days)
 */
router.post('/events/:eventId/send-reminders', async (req: Request, res: Response) => {
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

    // Import WhatsappService
    const { WhatsappService } = await import('../services/whatsappService');
    const result = await WhatsappService.sendEventReminders(eventIdString);

    logger.info(`Admin ${adminId} triggered reminders for event ${eventId}`, result);

    // Check if result is a queued job response
    if ('jobId' in result) {
      return res.json({
        success: true,
        message: `تم جدولة المهمة بنجاح. سيتم إرسال تذكيرات لـ ${result.guestCount} ضيف.`,
        data: {
          jobId: result.jobId,
          guestCount: result.guestCount,
          status: 'queued'
        }
      });
    }

    // Fallback for empty guest list case
    return res.json({
      success: true,
      message: 'لا يوجد ضيوف مؤكدين لإرسال التذكيرات لهم',
      data: result
    });

  } catch (error) {
    logger.error('Error sending reminders:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إرسال التذكيرات' }
    });
  }
});

/**
 * POST /api/admin/events/:eventId/send-thank-you
 * Send thank you messages to all attended guests (VIP only - after event)
 */
router.post('/events/:eventId/send-thank-you', async (req: Request, res: Response) => {
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

    // Import WhatsappService
    const { WhatsappService } = await import('../services/whatsappService');
    const result = await WhatsappService.sendThankYouMessages(eventIdString);

    logger.info(`Admin ${adminId} triggered thank you messages for event ${eventId}`, result);

    // Check if result is a queued job response
    if ('jobId' in result) {
      return res.json({
        success: true,
        message: `تم جدولة المهمة بنجاح. سيتم إرسال رسائل شكر لـ ${result.guestCount} ضيف.`,
        data: {
          jobId: result.jobId,
          guestCount: result.guestCount,
          status: 'queued'
        }
      });
    }

    // Fallback for empty guest list case
    return res.json({
      success: true,
      message: 'لا يوجد ضيوف حضروا لإرسال رسائل الشكر لهم',
      data: result
    });

  } catch (error) {
    logger.error('Error sending thank you messages:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إرسال رسائل الشكر' }
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
});

/**
 * PUT /api/admin/users/:userId/status
 * Update user status (active/suspended)
 */
router.put('/users/:userId/status', async (req: Request, res: Response) => {
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
});

/**
 * PUT /api/admin/users/:userId/role
 * Update user role (user/admin)
 */
router.put('/users/:userId/role', async (req: Request, res: Response) => {
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
});

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * GET /api/admin/orders
 * Get all orders with filtering and pagination
 */
router.get('/orders', async (req: Request, res: Response) => {
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
});

/**
 * GET /api/admin/orders/:orderId
 * Get detailed information about a specific order
 */
router.get('/orders/:orderId', async (req: Request, res: Response) => {
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
});

/**
 * POST /api/admin/orders/:orderId/complete
 * Manually mark order as completed and create events
 */
router.post('/orders/:orderId/complete', async (req: Request, res: Response) => {
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
    const { OrderService } = await import('../services/orderService');
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
});

/**
 * POST /api/admin/orders/:orderId/fail
 * Manually mark order as failed
 */
router.post('/orders/:orderId/fail', async (req: Request, res: Response) => {
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
});

/**
 * POST /api/admin/orders/:orderId/cancel
 * Manually cancel order
 */
router.post('/orders/:orderId/cancel', async (req: Request, res: Response) => {
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
});

/**
 * GET /api/admin/collaboration/analytics
 * Get detailed collaboration analytics
 */
router.get('/collaboration/analytics', async (req: Request, res: Response) => {
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
});

/**
 * POST /api/admin/notifications/:id/read
 * Mark notification as read
 */
router.post('/notifications/:id/read', async (req: Request, res: Response) => {
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
});

// ============================================
// USER CART MANAGEMENT
// ============================================

/**
 * GET /api/admin/users/:userId/cart
 * Get user's cart items (admin only)
 */
router.get('/users/:userId/cart', async (req: Request, res: Response) => {
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
});

/**
 * PUT /api/admin/users/:userId/cart/:cartItemId/price
 * Update cart item price manually (admin only)
 */
router.put('/users/:userId/cart/:cartItemId/price', async (req: Request, res: Response) => {
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

    // Invalidate cache
    const { CacheService } = await import('../services/cacheService');
    await CacheService.invalidateUserCartCache(userIdString);

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
});

/**
 * POST /api/admin/users/:userId/cart/:cartItemId/discount
 * Apply percentage discount to cart item (admin only)
 */
router.post('/users/:userId/cart/:cartItemId/discount', async (req: Request, res: Response) => {
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

    // Invalidate cache
    const { CacheService } = await import('../services/cacheService');
    await CacheService.invalidateUserCartCache(userIdString);

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
});

/**
 * POST /api/admin/users/:userId/cart/discount-all
 * Apply percentage discount to all cart items (admin only)
 */
router.post('/users/:userId/cart/discount-all', async (req: Request, res: Response) => {
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

    // Invalidate cache
    const { CacheService } = await import('../services/cacheService');
    await CacheService.invalidateUserCartCache(userIdString);

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
});

/**
 * DELETE /api/admin/users/:userId/cart/:cartItemId/price-modification
 * Remove admin price modification and restore original price (admin only)
 */
router.delete('/users/:userId/cart/:cartItemId/price-modification', async (req: Request, res: Response) => {
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

    // Invalidate cache
    const { CacheService } = await import('../services/cacheService');
    await CacheService.invalidateUserCartCache(userIdString);

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
});

export default router;