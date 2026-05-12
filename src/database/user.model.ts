import mongoose from 'mongoose';

export type UserRole = 'user' | 'manager' | 'admin' | 'intern';

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
      enum: ['user', 'manager', 'admin', 'intern'],
      default: 'user',
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
    deleteBy: {
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
