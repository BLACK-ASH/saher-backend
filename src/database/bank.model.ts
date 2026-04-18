import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      require: true,
    },
    accountNumber: {
      type: String,
      require: true,
    },
    bankName: {
      type: String,
      require: true,
    },
    branch: {
      type: String,
      require: true,
    },
    ifcs: {
      type: String,
      require: true,
    },
    mobileNumber: {
      type: String,
      require: true,
    },
  },
  { timestamps: true },
);

type BankType = mongoose.InferSchemaType<typeof bankSchema>;
export const Bank = mongoose.model<BankType>('Bank', bankSchema);
