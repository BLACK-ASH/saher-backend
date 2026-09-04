import mongoose from 'mongoose';

export const billStatus = ['pending', 'reject', 'accept', 'on-hold'];

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    images: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Media',
    },
    advance: {
      type: Number,
      default: 0,
      min: [0, 'Advance cannot be negative'],
    },
    amount: {
      type: Number,
      default: 0,
      min: [1, 'Amount must be greater than zero'],
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: billStatus,
      default: 'pending',
    },
    reason: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

billSchema.index({ user: 1, isDeleted: 1, createdAt: -1 });
billSchema.index({ date: 1, isDeleted: 1 });
billSchema.index({ description: 'text' });

export type BillType = mongoose.InferSchemaType<typeof billSchema>;
export const Bill = mongoose.model<BillType>('Bill', billSchema);
