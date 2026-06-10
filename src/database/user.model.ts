import mongoose from 'mongoose';

export const userRole = ['intern', 'user', 'manager', 'admin'] as const;
export type UserRole = (typeof userRole)[number];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: userRole,
      default: 'user',
    },
    pushNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedAt: {
      type: Date,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

export type UserType = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model<UserType>('User', userSchema);
