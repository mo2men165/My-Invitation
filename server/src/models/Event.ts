// server/src/models/Event.ts - UPDATED VERSION
import mongoose, { Document, Schema, Types } from 'mongoose';
import { ALLOWED_PHONE_PATTERN } from '../utils/phoneValidation';

export interface IGuest {
  _id?: Types.ObjectId;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number;
  whatsappMessageSent: boolean;
  whatsappSentAt?: Date;
  rsvpStatus?: 'pending' | 'accepted' | 'declined';
  rsvpResponse?: string;
  rsvpRespondedAt?: Date;
  addedAt: Date;
  updatedAt: Date;
  // Optional field to track who added this guest
  addedBy?: {
    type: 'owner' | 'collaborator';
    userId?: Types.ObjectId;
    collaboratorName?: string;
    collaboratorEmail?: string;
  };
  // Individual invite link for premium and VIP packages (optional)
  individualInviteLink?: string;
  // Post-event attendance tracking (VIP only)
  actuallyAttended?: boolean;
  attendanceMarkedAt?: Date;
  attendanceMarkedBy?: Types.ObjectId;
}

export interface IEvent extends Document {
  userId: Types.ObjectId;
  designId: Types.ObjectId;
  packageType: 'classic' | 'premium' | 'vip';
  details: {
    eventName: string;
    inviteCount: number;
    eventDate: Date;
    startTime: string;
    endTime: string;
    invitationText: string;
    hostName: string;
    eventLocation: string;
    additionalCards: number;
    gateSupervisors: number;
    fastDelivery: boolean;
    // Location fields
    placeId?: string;
    displayName?: string;
    formattedAddress?: string;
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    detectedCity?: string;
    googleMapsUrl?: string;
    // Custom design fields
    isCustomDesign?: boolean;
    customDesignNotes?: string;
  };
  totalPrice: number;
  status: 'upcoming' | 'cancelled' | 'done';
  
  // NEW: Admin approval fields
  approvalStatus: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedAt?: Date;
  
  guests: IGuest[];
  paymentCompletedAt: Date;
  guestListConfirmed: {
    isConfirmed: boolean;
    confirmedAt?: Date;
    confirmedBy?: Types.ObjectId;
    reopenedAt?: Date;
    reopenedBy?: Types.ObjectId;
    reopenCount?: number;
  };
  
  // Collaboration tracking (optional fields)
  collaborators?: {
    userId: Types.ObjectId;
    allocatedInvites: number;
    usedInvites: number;
    permissions: {
      canAddGuests: boolean;
      canEditGuests: boolean;
      canDeleteGuests: boolean;
      canViewFullEvent: boolean;
    };
    addedAt: Date;
    addedBy: Types.ObjectId;
  }[];
  totalAllocatedInvites?: number;
  
  createdAt: Date;
  updatedAt: Date;
  invitationCardUrl: string;
  qrCodeReaderUrl: string;
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
    match: ALLOWED_PHONE_PATTERN // Restricted to allowed countries
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
  whatsappSentAt: {
    type: Date
  },
  rsvpStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  rsvpResponse: {
    type: String
  },
  rsvpRespondedAt: {
    type: Date
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Optional field to track who added this guest
  addedBy: {
    type: {
      type: String,
      enum: ['owner', 'collaborator']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    collaboratorName: {
      type: String
    },
    collaboratorEmail: {
      type: String
    }
  },
  // Individual invite link for premium and VIP packages (optional)
  individualInviteLink: {
    type: String,
    trim: true
  },
  // Post-event attendance tracking (VIP only)
  actuallyAttended: {
    type: Boolean
  },
  attendanceMarkedAt: {
    type: Date
  },
  attendanceMarkedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
      type: Number,
      default: 0,
      min: 0,
      max: 10
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
      enum: ['المدينة المنورة', 'جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف']
    },
    googleMapsUrl: {
      type: String,
      trim: true
    },
    // Custom design fields
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
  status: {
    type: String,
    enum: ['upcoming', 'cancelled', 'done'],
    default: 'upcoming',
    index: true
  },
  
  // NEW: Admin approval fields
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
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
  },
  invitationCardUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Optional field
        return url.includes('drive.google.com') || url.includes('docs.google.com');
      },
      message: 'يجب أن يكون الرابط من Google Drive'
    }
  },
  qrCodeReaderUrl: {
    type: String,
    default: '',
    trim: true
  },
  guestListConfirmed: {
    isConfirmed: {
      type: Boolean,
      default: false
    },
    confirmedAt: {
      type: Date
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reopenedAt: {
      type: Date
    },
    reopenedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reopenCount: {
      type: Number,
      default: 0
    }
  },
  
  // Collaboration tracking (optional fields)
  collaborators: {
    type: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      allocatedInvites: {
        type: Number,
        required: true,
        min: 1,
        max: 500
      },
      usedInvites: {
        type: Number,
        default: 0,
        min: 0
      },
      permissions: {
        canAddGuests: {
          type: Boolean,
          default: true
        },
        canEditGuests: {
          type: Boolean,
          default: false
        },
        canDeleteGuests: {
          type: Boolean,
          default: false
        },
        canViewFullEvent: {
          type: Boolean,
          default: false
        }
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    }],
    default: []
  },
  totalAllocatedInvites: {
    type: Number,
    default: 0,
    min: 0
  }
},{ timestamps: true});

// NEW: Indexes for admin functionality
eventSchema.index({ approvalStatus: 1, paymentCompletedAt: 1 });
eventSchema.index({ userId: 1, approvalStatus: 1 });
eventSchema.index({ approvedBy: 1 });

// Existing indexes
eventSchema.index({ userId: 1, status: 1 });
eventSchema.index({ 'details.eventDate': 1, status: 1 });
eventSchema.index({ designId: 1, packageType: 1 });
eventSchema.index({ 'details.locationCoordinates': '2dsphere' });
eventSchema.index({ 'guests.phone': 1 });

// New indexes for collaboration
eventSchema.index({ 'collaborators.userId': 1 });
eventSchema.index({ userId: 1, 'collaborators.userId': 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);