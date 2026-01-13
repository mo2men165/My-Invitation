// Create src/services/notificationService.ts
import { AdminNotification } from '../models/AdminNotification';
import { Types } from 'mongoose';
import { User } from '../models/User';

export class NotificationService {
  /**
   * Create notification when new event is created
   */
  static async notifyNewEventPending(eventId: string, userId: string, eventDetails: any) {
    try {
      const notification = new AdminNotification({
        type: 'new_event_pending',
        title: 'حدث جديد في انتظار الموافقة',
        message: `حدث جديد من ${eventDetails.hostName} بتاريخ ${eventDetails.eventDate} في انتظار الموافقة`,
        eventId: new Types.ObjectId(eventId),
        userId: new Types.ObjectId(userId),
        isRead: false,
        readBy: []
      });

      await notification.save();
      
      // Here you would emit to Socket.IO for real-time updates
      // socketService.emitToAdmins('new_notification', notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating admin notification:', error);
      return null;
    }
  }

  /**
   * Mark notification as read by admin
   */
  static async markAsRead(notificationId: string, adminId: string) {
    try {
      const notification = await AdminNotification.findById(notificationId);
      if (!notification) return;

      if (!notification.readBy.includes(new Types.ObjectId(adminId))) {
        notification.readBy.push(new Types.ObjectId(adminId));
        await notification.save();
      }
      
      // Mark as read for this specific admin (individual read status)
      // The notification is considered read by this admin regardless of other admins
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}