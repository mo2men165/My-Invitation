// server/src/models/User.ts
import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Cart item interface with location fields
export interface ICartItem {
  _id?: Types.ObjectId;
  designId: Types.ObjectId;
  packageType: 'classic' | 'premium' | 'vip';
  details: {
    inviteCount: number;
    eventDate: Date;
    startTime: string;
    endTime: string;
    invitationText: string;
    hostName: string;
    eventLocation: string;
    additionalCards: number;
    gateSupervisors: number; // Changed from string to number
    extraHours?: number; // Added extraHours
    expeditedDelivery: boolean; // Added expeditedDelivery field
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    detectedCity: string; // Required field
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
  
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Cart item schema with location support
const cartItemSchema = new Schema<ICartItem>({
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
      max: 500 // Changed from 700 to 500
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
      type: Number, // Changed from String to Number
      default: 0,
      min: 0,
      max: 10
    },
    extraHours: {
      type: Number, // Added extraHours field
      default: 0,
      min: 0,
      max: 3
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
      },
    },
    detectedCity: {
      type: String,
      enum: ['المدينة المنورة', 'جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف'],
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
    required: true,
    index: true
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
    required: true,
    index: true
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
    index: true,
    match: /^\+[1-9]\d{1,14}$/ // International phone number format (E.164)
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
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

export const User = mongoose.model<IUser>('User', userSchema);