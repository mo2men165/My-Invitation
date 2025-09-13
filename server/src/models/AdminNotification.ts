// Create src/models/AdminNotification.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminNotification extends Document {
  type: 'new_event_pending' | 'payment_received';
  title: string;
  message: string;
  eventId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  isRead: boolean;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const adminNotificationSchema = new Schema<IAdminNotification>({
  type: {
    type: String,
    enum: ['new_event_pending', 'payment_received'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

adminNotificationSchema.index({ createdAt: -1 });
adminNotificationSchema.index({ isRead: 1 });

export const AdminNotification = mongoose.model<IAdminNotification>('AdminNotification', adminNotificationSchema);