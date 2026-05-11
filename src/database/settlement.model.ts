import mongoose from 'mongoose';

export const settleStatus = ['pending', 'settle', 'expired'];

export const settlementSchema = new mongoose.Schema({
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: settleStatus,
    default: 'pending',
  },
  expiredAt: {
    type: Date,
  },
});

type SettlementType = mongoose.InferSchemaType<typeof settlementSchema>;
export const Settlement = mongoose.model<SettlementType>('Settlement', settlementSchema);
