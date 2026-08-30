// server/src/models/PackageImage.ts
import mongoose, { Document, Schema } from 'mongoose';
import { ICloudinaryImage } from './Event';

export interface IPackageImage extends Document {
  name: string;
  image: ICloudinaryImage;
  packageTier?: 'classic' | 'premium' | 'vip';
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cloudinaryImageSchema = new Schema<ICloudinaryImage>({
  public_id: { type: String, required: true },
  secure_url: { type: String, required: true },
  url: { type: String, required: true },
  format: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  bytes: { type: Number, required: true },
  created_at: { type: String, required: true }
}, { _id: false });

const packageImageSchema = new Schema<IPackageImage>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  image: {
    type: cloudinaryImageSchema,
    required: true
  },
  packageTier: {
    type: String,
    enum: ['classic', 'premium', 'vip']
  },
  category: {
    type: String,
    enum: ['عيد ميلاد', 'حفل تخرج', 'حفل زفاف']
  }
}, {
  timestamps: true
});

packageImageSchema.index({ packageTier: 1 });
packageImageSchema.index({ category: 1 });

export const PackageImage = mongoose.model<IPackageImage>('PackageImage', packageImageSchema);
