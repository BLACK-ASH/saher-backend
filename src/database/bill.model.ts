import mongoose from 'mongoose';

export const BillStatus = ['pending', 'rejected', 'accepted'];

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dateOfPayment: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      // required: true,
    },
    status: {
      type: String,
      enum: BillStatus,
      default: 'pending',
    },
    adminNote: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true },
);

type ReimbursementType = mongoose.InferSchemaType<typeof billSchema>;
export const Reimbursement = mongoose.model<ReimbursementType>('Reimbursement', billSchema);
