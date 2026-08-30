// server/src/models/PasswordResetAttempt.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordResetAttempt extends Document {
  identifier: string; // email or phone
  count: number;
  expiresAt: Date;
}

const passwordResetAttemptSchema = new Schema<IPasswordResetAttempt>({
  identifier: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    required: true,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// TTL index: lockout window resets once the doc expires
passwordResetAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetAttempt = mongoose.model<IPasswordResetAttempt>('PasswordResetAttempt', passwordResetAttemptSchema);
