// server/src/models/PasswordReset.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPasswordReset extends Document {
  token: string;
  userId: Types.ObjectId;
  email: string;
  used: boolean;
  expiresAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// TTL index: Mongo's background purger removes a doc once its expiresAt passes
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema);
