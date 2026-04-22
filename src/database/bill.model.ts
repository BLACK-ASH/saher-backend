import mongoose from 'mongoose';

export const BillStatus = ['ON-HOLD', 'REJECTED', 'ACCEPTED'];

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    billImg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    billAmount: {
      type: Number,
      required: true,
    },
    dateOfPayment: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: BillStatus,
      default: 'ON-HOLD',
    },
  },
  { timestamps: true },
);

type ReimbursementType = mongoose.InferSchemaType<typeof billSchema>;
export const Reimbursement = mongoose.model<ReimbursementType>('Media', billSchema);
