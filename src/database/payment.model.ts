import mongoose from 'mongoose';

export const paymentStatus = ['PENDING', 'CLEARED'];
export const paymentClearerRole = ['ADMIN', 'MANAGER'];
export const requestType = ['USER_REIMBURSEMENT', 'ADMIN_RECOVERY'] as const;

export const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    reimbursement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reimbursement',
      required: true,
    },
    billImg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    status: {
      type: String,
      enum: paymentStatus,
      default: 'PENDING',
    },
    clearedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    clearedByRole: {
      type: String,
      enum: paymentClearerRole,
      default: null,
    },
    requestBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestType: {
      type: String,
      enum: requestType,
      required: true,
    },
    notes: { type: String },
    advanceAmount: { type: Number, default: 0 },
    pocketAmount: { type: Number, default: 0 },
    recoveryAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type PaymentType = mongoose.InferSchemaType<typeof paymentSchema>;
export const Payment = mongoose.model<PaymentType>('Payment', paymentSchema);
