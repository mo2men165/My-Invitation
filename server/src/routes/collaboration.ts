// server/src/routes/collaboration.ts
import { Router, Request, Response } from 'express';
import { collaborationService, CollaboratorData } from '../services/collaborationService';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { Types } from 'mongoose';
import { z } from 'zod';
import { phoneValidationSchema } from '../utils/phoneValidation';

const router = Router();

// Apply authentication middleware to all collaboration routes
router.use(checkJwt, extractUser, requireActiveUser);

// Validation schemas
const addCollaboratorSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين').max(100, 'الاسم طويل جداً'),
  email: z.string().email('البريد الإلكتروني غير صحيح').max(255),
  phone: phoneValidationSchema,
  city: z.enum(['المدينة المنورة', 'جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف']).refine(
    (val) => ['المدينة المنورة', 'جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف'].includes(val),
    { message: 'المدينة غير مدعومة' }
  ),
  allocatedInvites: z.number().min(1, 'يجب تخصيص دعوة واحدة على الأقل').max(500, 'تجاوز الحد الأقصى للدعوات'),
  permissions: z.object({
    canAddGuests: z.boolean().optional(),
    canEditGuests: z.boolean().optional(),
    canDeleteGuests: z.boolean().optional(),
    canViewFullEvent: z.boolean().optional()
  }).optional()
});

const updatePermissionsSchema = z.object({
  permissions: z.object({
    canAddGuests: z.boolean().optional(),
    canEditGuests: z.boolean().optional(),
    canDeleteGuests: z.boolean().optional(),
    canViewFullEvent: z.boolean().optional()
  }).optional(),
  allocatedInvites: z.number().min(1).max(500).optional()
});

/**
 * POST /api/collaboration/events/:eventId/collaborators
 * Add a collaborator to an event
 */
router.post('/events/:eventId/collaborators', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;

    // Validate request body
    const validationResult = addCollaboratorSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const collaboratorData: CollaboratorData = validationResult.data;

    // Add collaborator
    const result = await collaborationService.addCollaborator(
      eventId,
      userId,
      collaboratorData
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    logger.info(`Collaborator added by user ${userId}: ${collaboratorData.email} to event ${eventId}`);

    return res.status(201).json({
      success: true,
      message: result.message,
      collaborator: {
        id: result.collaborator!._id,
        name: result.collaborator!.name,
        email: result.collaborator!.email,
        phone: result.collaborator!.phone,
        isNewUser: result.isNewUser
      }
    });

  } catch (error) {
    logger.error('Error adding collaborator:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إضافة المتعاون' }
    });
  }
});

/**
 * GET /api/collaboration/events/:eventId/collaborators
 * Get collaborators for an event
 */
router.get('/events/:eventId/collaborators', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;

    const event = await Event.findOne({
      _id: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(userId)
    }).populate('collaborators.userId', 'firstName lastName name email phone');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'المناسبة غير موجودة' }
      });
    }

    const collaborators = event.collaborators?.map(collab => ({
      id: collab.userId._id,
      name: (collab.userId as any).name,
      email: (collab.userId as any).email,
      phone: (collab.userId as any).phone,
      allocatedInvites: collab.allocatedInvites,
      usedInvites: collab.usedInvites,
      permissions: collab.permissions,
      addedAt: collab.addedAt
    })) || [];

    return res.json({
      success: true,
      collaborators,
      totalAllocatedInvites: event.totalAllocatedInvites || 0,
      maxAllocation: event.details.inviteCount // Allow up to 100% of total invites
    });

  } catch (error) {
    logger.error('Error fetching collaborators:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب المتعاونين' }
    });
  }
});

/**
 * PATCH /api/collaboration/events/:eventId/collaborators/:collaboratorId
 * Update collaborator permissions
 */
router.patch('/events/:eventId/collaborators/:collaboratorId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId, collaboratorId } = req.params;

    // Validate request body
    const validationResult = updatePermissionsSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: { message: firstError.message }
      });
    }

    const { permissions, allocatedInvites } = validationResult.data;

    const result = await collaborationService.updateCollaboratorPermissions(
      eventId,
      userId,
      collaboratorId,
      permissions || {},
      allocatedInvites
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    return res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    logger.error('Error updating collaborator:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث المتعاون' }
    });
  }
});

/**
 * DELETE /api/collaboration/events/:eventId/collaborators/:collaboratorId
 * Remove a collaborator from an event
 */
router.delete('/events/:eventId/collaborators/:collaboratorId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId, collaboratorId } = req.params;

    const result = await collaborationService.removeCollaborator(
      eventId,
      userId,
      collaboratorId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    logger.info(`Collaborator removed by user ${userId}: ${collaboratorId} from event ${eventId}`);

    return res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    logger.error('Error removing collaborator:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في إزالة المتعاون' }
    });
  }
});

/**
 * GET /api/collaboration/my-events
 * Get user's events (both owned and collaborated)
 */
router.get('/my-events', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { role, status, limit = 10, page = 1 } = req.query;

    const events = await collaborationService.getUserEvents(userId);

    let filteredEvents = [...events.ownedEvents, ...events.collaboratedEvents];

    // Apply filters
    if (role && typeof role === 'string') {
      if (role === 'owner') {
        filteredEvents = events.ownedEvents;
      } else if (role === 'collaborator') {
        filteredEvents = events.collaboratedEvents;
      }
    }

    if (status && typeof status === 'string') {
      filteredEvents = filteredEvents.filter(event => event.status === status);
    }

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedEvents = filteredEvents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + Number(limit));

    return res.json({
      success: true,
      events: paginatedEvents,
      summary: {
        totalEvents: filteredEvents.length,
        ownedEvents: events.ownedEvents.length,
        collaboratedEvents: events.collaboratedEvents.length
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredEvents.length,
        totalPages: Math.ceil(filteredEvents.length / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching user events:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب المناسبات' }
    });
  }
});

/**
 * GET /api/collaboration/events/:eventId/permissions
 * Get user's permissions for a specific event
 */
router.get('/events/:eventId/permissions', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;

    // Check if user owns the event
    const ownedEvent = await Event.findOne({
      _id: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(userId)
    });

    if (ownedEvent) {
      return res.json({
        success: true,
        role: 'owner',
        permissions: {
          canAddGuests: true,
          canEditGuests: true,
          canDeleteGuests: true,
          canViewFullEvent: true,
          canManageCollaborators: true
        },
        allocatedInvites: ownedEvent.details.inviteCount,
        usedInvites: ownedEvent.guests.reduce((total, guest) => total + guest.numberOfAccompanyingGuests, 0)
      });
    }

    // Check if user is a collaborator
    const collaboratedEvent = await Event.findOne({
      _id: new Types.ObjectId(eventId),
      'collaborators.userId': new Types.ObjectId(userId)
    });

    if (collaboratedEvent) {
      const collaboration = collaboratedEvent.collaborators?.find(
        collab => collab.userId.toString() === userId
      );

      if (collaboration) {
        return res.json({
          success: true,
          role: 'collaborator',
          permissions: {
            ...collaboration.permissions,
            canManageCollaborators: false
          },
          allocatedInvites: collaboration.allocatedInvites,
          usedInvites: collaboration.usedInvites
        });
      }
    }

    return res.status(403).json({
      success: false,
      error: { message: 'ليس لديك صلاحية للوصول إلى هذه المناسبة' }
    });

  } catch (error) {
    logger.error('Error checking event permissions:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في التحقق من الصلاحيات' }
    });
  }
});

/**
 * GET /api/collaboration/stats
 * Get collaboration statistics for the user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'المستخدم غير موجود' }
      });
    }

    // Get owned events with collaborators
    const ownedEventsWithCollaborators = await Event.find({
      userId: new Types.ObjectId(userId),
      'collaborators.0': { $exists: true } // Events that have at least one collaborator
    });

    // Get collaborated events
    const collaboratedEventsCount = user.collaboratedEvents?.length || 0;

    // Calculate total guests added by user as collaborator
    const collaboratedEvents = await Event.find({
      'collaborators.userId': new Types.ObjectId(userId)
    });

    const totalGuestsAddedAsCollaborator = collaboratedEvents.reduce((total, event) => {
      return total + event.guests.filter(guest => 
        guest.addedBy?.type === 'collaborator' && 
        guest.addedBy?.userId?.toString() === userId
      ).reduce((guestTotal, guest) => guestTotal + guest.numberOfAccompanyingGuests, 0);
    }, 0);

    const stats = {
      // As event owner
      eventsWithCollaborators: ownedEventsWithCollaborators.length,
      totalCollaboratorsManaged: ownedEventsWithCollaborators.reduce(
        (total, event) => total + (event.collaborators?.length || 0), 0
      ),
      
      // As collaborator
      eventsCollaboratedIn: collaboratedEventsCount,
      totalGuestsAddedAsCollaborator,
      
      // General
      accountOrigin: user.accountOrigin || 'self_registered',
      invitedBy: user.invitedBy || null
    };

    return res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Error fetching collaboration stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب الإحصائيات' }
    });
  }
});

export default router;
