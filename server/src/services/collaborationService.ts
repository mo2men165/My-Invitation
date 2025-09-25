// server/src/services/collaborationService.ts
import { User, IUser } from '../models/User';
import { Event, IEvent } from '../models/Event';
import { emailService } from './emailService';
import { logger } from '../config/logger';
import { Types } from 'mongoose';
import crypto from 'crypto';

export interface CollaboratorData {
  name: string;
  email: string;
  phone: string;
  city: string;
  allocatedInvites: number;
  permissions?: {
    canAddGuests?: boolean;
    canEditGuests?: boolean;
    canDeleteGuests?: boolean;
    canViewFullEvent?: boolean;
  };
}

export interface CollaborationResult {
  success: boolean;
  collaborator?: IUser;
  isNewUser?: boolean;
  message?: string;
  error?: string;
}

export class CollaborationService {
  
  /**
   * Generate a secure random password
   */
  static generateSecurePassword(): string {
    // Generate a readable but secure password
    const adjectives = ['سعيد', 'جميل', 'قوي', 'ذكي', 'سريع', 'نشيط', 'مميز', 'رائع'];
    const nouns = ['نجم', 'بحر', 'جبل', 'ورد', 'قمر', 'شمس', 'نور', 'أمل'];
    const numbers = Math.floor(Math.random() * 99) + 10;
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}${noun}${numbers}!`;
  }

  /**
   * Add a collaborator to an event
   */
  static async addCollaborator(
    eventId: string,
    ownerUserId: string,
    collaboratorData: CollaboratorData
  ): Promise<CollaborationResult> {
    try {
      // 1. Validate event exists and user owns it
      const event = await Event.findOne({
        _id: new Types.ObjectId(eventId),
        userId: new Types.ObjectId(ownerUserId)
      });

      if (!event) {
        return {
          success: false,
          error: 'المناسبة غير موجودة أو ليس لديك صلاحية للوصول إليها'
        };
      }

      // 2. Check if package allows collaborations
      if (event.packageType === 'classic') {
        return {
          success: false,
          error: 'الحزمة الكلاسيكية لا تدعم المتعاونين. يرجى الترقية إلى حزمة بريميوم أو VIP'
        };
      }

      // 3. Check collaboration limits
      const maxCollaborators = event.packageType === 'premium' ? 2 : 10; // VIP gets more
      const currentCollaborators = event.collaborators?.length || 0;
      
      if (currentCollaborators >= maxCollaborators) {
        return {
          success: false,
          error: `تم الوصول للحد الأقصى من المتعاونين (${maxCollaborators}) لهذه الحزمة`
        };
      }

      // 4. Check invite allocation limits - removed percentage restrictions
      const currentAllocated = event.totalAllocatedInvites || 0;
      const totalInvites = event.details.inviteCount;
      
      if (currentAllocated + collaboratorData.allocatedInvites > totalInvites) {
        return {
          success: false,
          error: `لا يمكن تخصيص أكثر من ${totalInvites} دعوة للمتعاونين (متبقي: ${totalInvites - currentAllocated})`
        };
      }

      // 5. Check if user already exists
      let collaboratorUser = await User.findOne({ 
        email: collaboratorData.email.toLowerCase().trim() 
      });
      
      let isNewUser = false;
      let tempPassword = '';

      if (!collaboratorUser) {
        // 6. Create new user account
        isNewUser = true;
        tempPassword = this.generateSecurePassword();
        
        const nameParts = collaboratorData.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;

        collaboratorUser = new User({
          firstName,
          lastName,
          name: collaboratorData.name.trim(),
          email: collaboratorData.email.toLowerCase().trim(),
          phone: collaboratorData.phone.trim(),
          city: collaboratorData.city,
          password: tempPassword, // Will be hashed by pre-save middleware
          accountOrigin: 'collaborator_invited',
          invitedBy: new Types.ObjectId(ownerUserId),
          role: 'user',
          status: 'active'
        });

        await collaboratorUser.save();
        logger.info(`New collaborator account created: ${collaboratorUser.email}`);
      } else {
        // Check if already a collaborator on this event
        const existingCollaboration = event.collaborators?.find(
          collab => collab.userId.toString() === (collaboratorUser!._id as Types.ObjectId).toString()
        );
        
        if (existingCollaboration) {
          return {
            success: false,
            error: 'هذا المستخدم متعاون بالفعل في هذه المناسبة'
          };
        }
      }

      // 7. Set default permissions based on package
      const defaultPermissions = {
        canAddGuests: true,
        canEditGuests: event.packageType === 'vip',
        canDeleteGuests: event.packageType === 'vip',
        canViewFullEvent: false
      };

      const permissions = {
        ...defaultPermissions,
        ...collaboratorData.permissions
      };

      // 8. Add collaboration to event
      const collaboration = {
        userId: collaboratorUser._id as Types.ObjectId,
        allocatedInvites: collaboratorData.allocatedInvites,
        usedInvites: 0,
        permissions,
        addedAt: new Date(),
        addedBy: new Types.ObjectId(ownerUserId)
      };

      event.collaborators = event.collaborators || [];
      event.collaborators.push(collaboration);
      event.totalAllocatedInvites = (event.totalAllocatedInvites || 0) + collaboratorData.allocatedInvites;
      await event.save();

      // 9. Add to collaborator's collaborated events
      const collaboratedEvent = {
        eventId: new Types.ObjectId(eventId),
        role: 'collaborator' as const,
        permissions,
        addedAt: new Date(),
        addedBy: new Types.ObjectId(ownerUserId),
        allocatedInvites: collaboratorData.allocatedInvites,
        usedInvites: 0
      };

      collaboratorUser.collaboratedEvents = collaboratorUser.collaboratedEvents || [];
      collaboratorUser.collaboratedEvents.push(collaboratedEvent);
      await collaboratorUser.save();

      // 10. Send welcome email
      if (isNewUser) {
        await this.sendCollaboratorWelcomeEmail(
          collaboratorUser,
          tempPassword,
          event,
          ownerUserId
        );
      } else {
        await this.sendCollaboratorInviteEmail(
          collaboratorUser,
          event,
          ownerUserId
        );
      }

      logger.info(`Collaborator added successfully: ${collaboratorUser.email} to event ${eventId}`);

      return {
        success: true,
        collaborator: collaboratorUser,
        isNewUser,
        message: isNewUser 
          ? 'تم إنشاء حساب جديد للمتعاون وإرسال بيانات الدخول عبر البريد الإلكتروني'
          : 'تم إضافة المتعاون بنجاح وإرسال إشعار عبر البريد الإلكتروني'
      };

    } catch (error) {
      logger.error('Error adding collaborator:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء إضافة المتعاون'
      };
    }
  }

  /**
   * Remove a collaborator from an event
   */
  static async removeCollaborator(
    eventId: string,
    ownerUserId: string,
    collaboratorUserId: string
  ): Promise<CollaborationResult> {
    try {
      // 1. Find and update event
      const event = await Event.findOneAndUpdate(
        {
          _id: new Types.ObjectId(eventId),
          userId: new Types.ObjectId(ownerUserId),
          'collaborators.userId': new Types.ObjectId(collaboratorUserId)
        },
        {
          $pull: { 
            collaborators: { userId: new Types.ObjectId(collaboratorUserId) }
          }
        },
        { new: true }
      );

      if (!event) {
        return {
          success: false,
          error: 'المناسبة أو المتعاون غير موجود'
        };
      }

      // 2. Update total allocated invites
      const remainingAllocated = event.collaborators?.reduce(
        (total, collab) => total + collab.allocatedInvites, 0
      ) || 0;
      
      event.totalAllocatedInvites = remainingAllocated;
      await event.save();

      // 3. Remove from collaborator's collaborated events
      await User.updateOne(
        { _id: new Types.ObjectId(collaboratorUserId) },
        {
          $pull: {
            collaboratedEvents: { eventId: new Types.ObjectId(eventId) }
          }
        }
      );

      logger.info(`Collaborator removed: ${collaboratorUserId} from event ${eventId}`);

      return {
        success: true,
        message: 'تم إزالة المتعاون بنجاح'
      };

    } catch (error) {
      logger.error('Error removing collaborator:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء إزالة المتعاون'
      };
    }
  }

  /**
   * Update collaborator permissions
   */
  static async updateCollaboratorPermissions(
    eventId: string,
    ownerUserId: string,
    collaboratorUserId: string,
    permissions: Partial<{
      canAddGuests: boolean;
      canEditGuests: boolean;
      canDeleteGuests: boolean;
      canViewFullEvent: boolean;
    }>,
    allocatedInvites?: number
  ): Promise<CollaborationResult> {
    try {
      const event = await Event.findOne({
        _id: new Types.ObjectId(eventId),
        userId: new Types.ObjectId(ownerUserId)
      });

      if (!event) {
        return {
          success: false,
          error: 'المناسبة غير موجودة'
        };
      }

      const collaboratorIndex = event.collaborators?.findIndex(
        collab => collab.userId.toString() === collaboratorUserId
      );

      if (collaboratorIndex === -1 || collaboratorIndex === undefined) {
        return {
          success: false,
          error: 'المتعاون غير موجود'
        };
      }

      // Update permissions
      if (event.collaborators && event.collaborators[collaboratorIndex]) {
        Object.assign(event.collaborators[collaboratorIndex].permissions, permissions);
        
        if (allocatedInvites !== undefined) {
          const oldAllocation = event.collaborators[collaboratorIndex].allocatedInvites;
          event.collaborators[collaboratorIndex].allocatedInvites = allocatedInvites;
          event.totalAllocatedInvites = (event.totalAllocatedInvites || 0) - oldAllocation + allocatedInvites;
        }
      }

      await event.save();

      // Update in user's collaborated events as well
      await User.updateOne(
        { 
          _id: new Types.ObjectId(collaboratorUserId),
          'collaboratedEvents.eventId': new Types.ObjectId(eventId)
        },
        {
          $set: {
            'collaboratedEvents.$.permissions': {
              ...event.collaborators![collaboratorIndex].permissions
            },
            ...(allocatedInvites !== undefined && {
              'collaboratedEvents.$.allocatedInvites': allocatedInvites
            })
          }
        }
      );

      return {
        success: true,
        message: 'تم تحديث صلاحيات المتعاون بنجاح'
      };

    } catch (error) {
      logger.error('Error updating collaborator permissions:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء تحديث الصلاحيات'
      };
    }
  }

  /**
   * Send welcome email to new collaborator
   */
  private static async sendCollaboratorWelcomeEmail(
    collaborator: IUser,
    tempPassword: string,
    event: IEvent,
    ownerUserId: string
  ): Promise<void> {
    try {
      const owner = await User.findById(ownerUserId);
      if (!owner) return;

      const subject = `مرحباً بك في منصة My Invitation - دعوة للتعاون في إدارة مناسبة`;
      
      const htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #C09B52 0%, #B8935A 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">مرحباً بك في My Invitation</h1>
            <p style="color: #f8f9fa; margin: 10px 0 0 0; font-size: 16px;">منصة الدعوات الرقمية المتقدمة</p>
          </div>
          
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">مرحباً ${collaborator.firstName}،</h2>
            
            <p style="color: #555; line-height: 1.8; font-size: 16px;">
              تم دعوتك من قبل <strong>${owner.name}</strong> للمساعدة في إدارة قائمة ضيوف مناسبة 
              "<strong>${event.details.hostName}</strong>".
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0;">
              <h3 style="color: #C09B52; margin-top: 0;">تم إنشاء حسابك الجديد</h3>
              <p style="margin: 15px 0;"><strong>البريد الإلكتروني:</strong> ${collaborator.email}</p>
              <p style="margin: 15px 0;"><strong>كلمة المرور:</strong> <code style="background: #e9ecef; padding: 5px 10px; border-radius: 5px; color: #d73502;">${tempPassword}</code></p>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                ⚠️ يرجى تغيير كلمة المرور بعد تسجيل الدخول لأول مرة
              </p>
            </div>
            
            <div style="background: #e8f5e8; padding: 25px; border-radius: 10px; margin: 25px 0;">
              <h3 style="color: #28a745; margin-top: 0;">تفاصيل المشاركة</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li>نوع المناسبة: ${event.packageType === 'premium' ? 'بريميوم' : 'VIP'}</li>
                <li>تاريخ المناسبة: ${new Date(event.details.eventDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</li>
                <li>الموقع: ${event.details.eventLocation}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #C09B52 0%, #B8935A 100%); 
                        color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                        font-weight: bold; font-size: 16px;">
                تسجيل الدخول الآن
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-top: 30px;">
              <h4 style="color: #856404; margin-top: 0;">ما يمكنك فعله:</h4>
              <ul style="color: #856404; line-height: 1.6;">
                <li>إضافة ضيوف جدد لقائمة المدعوين</li>
                <li>إدارة بيانات الضيوف المخصصين لك</li>
                <li>تتبع حالة الدعوات المرسلة</li>
                <li>التعاون مع صاحب المناسبة في التنظيم</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 14px;">
              هذا الحساب تم إنشاؤه خصيصاً لك. يمكنك استخدامه لإنشاء مناسباتك الخاصة أيضاً.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
              فريق My Invitation | منصة الدعوات الرقمية
            </p>
          </div>
        </div>
      `;

      await emailService.sendEmail(
        { email: collaborator.email, name: collaborator.firstName },
        subject,
        htmlContent
      );

      logger.info(`Welcome email sent to new collaborator: ${collaborator.email}`);
    } catch (error) {
      logger.error('Error sending welcome email:', error);
    }
  }

  /**
   * Send invite email to existing user
   */
  private static async sendCollaboratorInviteEmail(
    collaborator: IUser,
    event: IEvent,
    ownerUserId: string
  ): Promise<void> {
    try {
      const owner = await User.findById(ownerUserId);
      if (!owner) return;

      const subject = `دعوة للتعاون في إدارة مناسبة - My Invitation`;
      
      const htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #C09B52 0%, #B8935A 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">دعوة للتعاون</h1>
            <p style="color: #f8f9fa; margin: 10px 0 0 0; font-size: 16px;">My Invitation</p>
          </div>
          
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">مرحباً ${collaborator.firstName}،</h2>
            
            <p style="color: #555; line-height: 1.8; font-size: 16px;">
              تم دعوتك من قبل <strong>${owner.name}</strong> للمساعدة في إدارة قائمة ضيوف مناسبة 
              "<strong>${event.details.hostName}</strong>".
            </p>
            
            <div style="background: #e8f5e8; padding: 25px; border-radius: 10px; margin: 25px 0;">
              <h3 style="color: #28a745; margin-top: 0;">تفاصيل المناسبة</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li>نوع المناسبة: ${event.packageType === 'premium' ? 'بريميوم' : 'VIP'}</li>
                <li>تاريخ المناسبة: ${new Date(event.details.eventDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</li>
                <li>الموقع: ${event.details.eventLocation}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #C09B52 0%, #B8935A 100%); 
                        color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                        font-weight: bold; font-size: 16px;">
                تسجيل الدخول للمشاركة
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 14px;">
              سجل دخولك لبدء المساعدة في إدارة قائمة الضيوف
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
              فريق My Invitation | منصة الدعوات الرقمية
            </p>
          </div>
        </div>
      `;

      await emailService.sendEmail(
        { email: collaborator.email, name: collaborator.firstName },
        subject,
        htmlContent
      );

      logger.info(`Invite email sent to existing user: ${collaborator.email}`);
    } catch (error) {
      logger.error('Error sending invite email:', error);
    }
  }

  /**
   * Get collaborator's events (both owned and collaborated)
   */
  static async getUserEvents(userId: string) {
    try {
      const user = await User.findById(userId).populate('collaboratedEvents.eventId');
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // Get owned events
      const ownedEvents = await Event.find({ userId }).populate('designId collaborators.userId');

      // Get collaborated events
      const collaboratedEventIds = user.collaboratedEvents?.map(collab => collab.eventId) || [];
      const collaboratedEvents = await Event.find({
        _id: { $in: collaboratedEventIds }
      }).populate('designId userId');

      // Add role and permissions info
      const collaboratedEventsWithRole = collaboratedEvents.map(event => {
        const collaboration = user.collaboratedEvents?.find(
          collab => collab.eventId.toString() === (event._id as Types.ObjectId).toString()
        );
        
        return {
          ...event.toObject(),
          userRole: 'collaborator',
          permissions: collaboration?.permissions,
          allocatedInvites: collaboration?.allocatedInvites,
          usedInvites: collaboration?.usedInvites
        };
      });

      const ownedEventsWithRole = ownedEvents.map(event => ({
        ...event.toObject(),
        userRole: 'owner'
      }));

      return {
        ownedEvents: ownedEventsWithRole,
        collaboratedEvents: collaboratedEventsWithRole,
        totalEvents: ownedEvents.length + collaboratedEvents.length
      };

    } catch (error) {
      logger.error('Error getting user events:', error);
      throw error;
    }
  }
}

export const collaborationService = CollaborationService;
