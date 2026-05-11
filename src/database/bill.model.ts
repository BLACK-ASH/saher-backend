import mongoose from 'mongoose';

export const billStatus = ['pending', 'rejected', 'accepted'];

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
    image: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Media',
      required: true,
    },
    advance: {
      type: Number,
    },
    amount: {
      type: Number,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
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
