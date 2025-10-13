// server/src/models/Order.ts
import mongoose, { Document, Schema, Types } from 'mongoose';
import { ICartItem } from './User';

export interface IOrder extends Document {
  userId: Types.ObjectId;
  paymobOrderId: number;           // Paymob's order ID from webhook
  merchantOrderId: string;         // What we sent to Paymob
  selectedCartItems: {
    cartItemId: Types.ObjectId;    // Unique cart item ID
    cartItemData: ICartItem;       // Full cart item data snapshot
  }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  eventsCreated: Types.ObjectId[]; // Array of created event IDs
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  paymobTransactionId?: string;    // Transaction ID from webhook
}

const selectedCartItemSchema = new Schema({
  cartItemId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  cartItemData: {
    designId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    packageType: {
      type: String,
      enum: ['classic', 'premium', 'vip'],
      required: true
    },
    details: {
      eventName: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true
      },
      inviteCount: {
        type: Number,
        required: true,
        min: 100,
        max: 700
      },
      eventDate: {
        type: Date,
        required: true
      },
      startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      invitationText: {
        type: String,
        required: true,
        maxlength: 1000
      },
      hostName: {
        type: String,
        required: true,
        maxlength: 100
      },
      eventLocation: {
        type: String,
        required: true,
        maxlength: 200
      },
      additionalCards: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      gateSupervisors: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
      },
      extraHours: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
      },
      fastDelivery: {
        type: Boolean,
        default: false
      },
      // Location fields
      placeId: {
        type: String,
        trim: true
      },
      displayName: {
        type: String,
        trim: true,
        maxlength: 200
      },
      formattedAddress: {
        type: String,
        trim: true,
        maxlength: 500
      },
      locationCoordinates: {
        lat: {
          type: Number,
          min: -90,
          max: 90
        },
        lng: {
          type: Number,
          min: -180,
          max: 180
        }
      },
      detectedCity: {
        type: String,
        required: true,
        enum: ['المدينة المنورة', 'جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف']
      },
      googleMapsUrl: {
        type: String,
        trim: true
      },
      isCustomDesign: {
        type: Boolean,
        default: false
      },
      customDesignNotes: {
        type: String,
        maxlength: 500,
        default: ''
      }
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  paymobOrderId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  merchantOrderId: {
    type: String,
    required: true,
    index: true
  },
  selectedCartItems: {
    type: [selectedCartItemSchema],
    required: true,
    validate: {
      validator: function(items: any[]) {
        return items.length > 0;
      },
      message: 'Order must have at least one selected cart item'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    default: 'paymob'
  },
  eventsCreated: {
    type: [Schema.Types.ObjectId],
    ref: 'Event',
    default: []
  },
  completedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  paymobTransactionId: {
    type: String
  }
}, { timestamps: true });

// Indexes for efficient queries
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ paymobOrderId: 1 });
orderSchema.index({ merchantOrderId: 1 });
orderSchema.index({ status: 1, createdAt: 1 });
orderSchema.index({ 'selectedCartItems.cartItemId': 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
