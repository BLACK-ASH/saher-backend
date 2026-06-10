import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    ifcs: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

type BankType = mongoose.InferSchemaType<typeof bankSchema>;
export const Bank = mongoose.model<BankType>('Bank', bankSchema);
