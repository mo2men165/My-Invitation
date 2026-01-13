// server/src/models/Bill.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBill extends Document {
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  billNumber: string; // Unique bill number
  paymentId: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: Date;
  events: Array<{
    eventId: Types.ObjectId;
    eventName?: string;
    hostName: string;
    eventDate: Date;
    eventLocation: string;
    packageType: string;
    inviteCount: number;
    price: number;
  }>;
  user: {
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  emailSent: boolean; // Whether email was sent to user
  emailSentAt?: Date; // When email was sent
  createdAt: Date;
  updatedAt: Date;
}

const eventItemSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  hostName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventLocation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  packageType: {
    type: String,
    enum: ['classic', 'premium', 'vip'],
    required: true
  },
  inviteCount: {
    type: Number,
    required: true,
    min: 100,
    max: 700
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const userInfoSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  }
}, { _id: false });

const billSchema = new Schema<IBill>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  billNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentId: {
    type: String,
    required: true,
    index: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'paymob'
  },
  transactionId: {
    type: String
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  events: {
    type: [eventItemSchema],
    required: true,
    validate: {
      validator: function(events: any[]) {
        return events.length > 0;
      },
      message: 'Bill must have at least one event'
    }
  },
  user: {
    type: userInfoSchema,
    required: true
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  }
}, { timestamps: true });

// Indexes for efficient queries
billSchema.index({ userId: 1, createdAt: -1 });
billSchema.index({ paymentDate: -1 });

export const Bill = mongoose.model<IBill>('Bill', billSchema);