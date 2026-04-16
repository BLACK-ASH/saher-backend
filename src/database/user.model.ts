import mongoose from 'mongoose';

export type UserRole = 'user' | 'manager' | 'admin';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    displayName: {
      type: String,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'manager', 'admin'],
      default: 'user',
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      require: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deleteBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

type UserType = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model<UserType>('User', userSchema);
