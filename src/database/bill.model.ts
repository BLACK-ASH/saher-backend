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
    },
    amount: {
      type: Number,
      default: 0,
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

type BillType = mongoose.InferSchemaType<typeof billSchema>;
export const Bill = mongoose.model<BillType>('Bill', billSchema);
