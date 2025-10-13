// server/src/models/User.ts
import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ALLOWED_PHONE_PATTERN } from '../utils/phoneValidation';

// Cart item interface with location fields
export interface ICartItem {
  _id?: Types.ObjectId;
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
    extraHours: number;
    fastDelivery: boolean;
    // Location fields
    placeId?: string;
    displayName?: string;
    formattedAddress?: string;
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    detectedCity: string;
    googleMapsUrl?: string;
    // Custom design fields
    isCustomDesign?: boolean;
    customDesignNotes?: string;
  };
  totalPrice: number;
  addedAt: Date;
  updatedAt: Date;
}

// Wishlist item interface
export interface IWishlistItem {
  _id?: Types.ObjectId;
  designId: Types.ObjectId;
  packageType?: 'classic' | 'premium' | 'vip';
  addedAt: Date;
}

// Compare item interface
export interface ICompareItem {
  _id?: Types.ObjectId;
  designId: Types.ObjectId;
  packageType: 'classic' | 'premium' | 'vip';
  addedAt: Date;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  lastLogin?: Date;
  
  cart: ICartItem[];
  wishlist: IWishlistItem[];
  compareList: ICompareItem[];
  
  // Collaboration tracking (optional fields)
  collaboratedEvents?: {
    eventId: Types.ObjectId;
    role: 'owner' | 'collaborator';
    permissions: {
      canAddGuests: boolean;
      canEditGuests: boolean;
      canDeleteGuests: boolean;
      canViewFullEvent: boolean;
    };
    addedAt: Date;
    addedBy: Types.ObjectId;
    allocatedInvites?: number;
    usedInvites?: number;
  }[];
  
  // Account origin tracking (optional fields)
  accountOrigin?: 'self_registered' | 'collaborator_invited';
  invitedBy?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Cart item schema with location support
const cartItemSchema = new Schema<ICartItem>({
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
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Wishlist item schema
const wishlistItemSchema = new Schema<IWishlistItem>({
  designId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  packageType: {
    type: String,
    enum: ['classic', 'premium', 'vip'],
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Compare item schema
const compareItemSchema = new Schema<ICompareItem>({
  designId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  packageType: {
    type: String,
    enum: ['classic', 'premium', 'vip'],
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Collaborated events schema
const collaboratedEventSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'collaborator'],
    required: true
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
  },
  allocatedInvites: {
    type: Number,
    min: 0,
    max: 500
  },
  usedInvites: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: true });

// User schema
const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 25
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 25
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    match: ALLOWED_PHONE_PATTERN // Restricted to allowed countries
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  city: {
    type: String,
    required: true,
    enum: ['المدينة المنورة', 'جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  cart: {
    type: [cartItemSchema],
    default: [],
    validate: {
      validator: function(cart: ICartItem[]) {
        return cart.length <= 50;
      },
      message: 'Cart cannot contain more than 50 items'
    }
  },
  wishlist: {
    type: [wishlistItemSchema],
    default: [],
    validate: {
      validator: function(wishlist: IWishlistItem[]) {
        return wishlist.length <= 200;
      },
      message: 'Wishlist cannot contain more than 200 items'
    }
  },
  compareList: {
    type: [compareItemSchema],
    default: [],
    validate: {
      validator: function(compareList: ICompareItem[]) {
        return compareList.length <= 3;
      },
      message: 'Compare list cannot contain more than 3 items'
    }
  },
  
  // Collaboration tracking (optional fields)
  collaboratedEvents: {
    type: [collaboratedEventSchema],
    default: [],
    validate: {
      validator: function(collaboratedEvents: any[]) {
        return collaboratedEvents.length <= 50; // Reasonable limit
      },
      message: 'Cannot collaborate on more than 50 events'
    }
  },
  
  // Account origin tracking (optional fields)
  accountOrigin: {
    type: String,
    enum: ['self_registered', 'collaborator_invited'],
    default: 'self_registered'
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  this.name = `${this.firstName} ${this.lastName}`;
  
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ email: 1, role: 1 }, { unique: true });
userSchema.index({ phone: 1, role: 1 }, { unique: true });
userSchema.index({ 'cart.designId': 1 });
userSchema.index({ 'wishlist.designId': 1 });
userSchema.index({ 'compareList.designId': 1 });
userSchema.index({ 'cart.details.locationCoordinates': '2dsphere' });

// New indexes for collaboration
userSchema.index({ 'collaboratedEvents.eventId': 1 });
userSchema.index({ accountOrigin: 1 });
userSchema.index({ invitedBy: 1 });

export const User = mongoose.model<IUser>('User', userSchema);