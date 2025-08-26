// server/src/models/Event.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGuest {
  _id?: Types.ObjectId;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number; // Total people (guest + accompanying)
  whatsappMessageSent: boolean;
  addedAt: Date;
  updatedAt: Date;
}

export interface IEvent extends Document {
  userId: Types.ObjectId;
  designId: Types.ObjectId;
  packageType: 'classic' | 'premium' | 'vip';
  details: {
    inviteCount: number;
    qrCode: boolean;
    eventDate: Date;
    startTime: string;
    endTime: string;
    invitationText: string;
    hostName: string;
    eventLocation: string;
    additionalCards: number;
    gateSupervisors: string;
    fastDelivery: boolean;
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    detectedCity?: string;
  };
  totalPrice: number;
  status: 'upcoming' | 'cancelled' | 'done';
  guests: IGuest[];
  paymentCompletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuest>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    match: /^\+966[5][0-9]{8}$/
  },
  numberOfAccompanyingGuests: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  whatsappMessageSent: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const eventSchema = new Schema<IEvent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  designId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  packageType: {
    type: String,
    enum: ['classic', 'premium', 'vip'],
    required: true
  },
  details: {
    inviteCount: {
      type: Number,
      required: true,
      min: 100,
      max: 700
    },
    qrCode: {
      type: Boolean,
      default: true
    },
    eventDate: {
      type: Date,
      required: true,
      index: true
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
      type: String,
      enum: ['', '100-300 مدعو', '300-500 مدعو', '500-700 مدعو'],
      default: ''
    },
    fastDelivery: {
      type: Boolean,
      default: false
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
      enum: ['جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف']
    }
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'cancelled', 'done'],
    default: 'upcoming',
    index: true
  },
  guests: {
    type: [guestSchema],
    default: [],
    validate: {
      validator: function(guests: IGuest[]) {
        const totalGuestCount = guests.reduce((sum, guest) => sum + guest.numberOfAccompanyingGuests, 0);
        return totalGuestCount <= this.details.inviteCount;
      },
      message: 'إجمالي عدد الضيوف لا يمكن أن يتجاوز عدد الدعوات المحددة'
    }
  },
  paymentCompletedAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ userId: 1, status: 1 });
eventSchema.index({ 'details.eventDate': 1, status: 1 });
eventSchema.index({ designId: 1, packageType: 1 });
eventSchema.index({ 'details.locationCoordinates': '2dsphere' });
eventSchema.index({ 'guests.phone': 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);