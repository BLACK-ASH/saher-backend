import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    used: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

export const LeaveBalance = mongoose.model('leaveBalance', leaveBalanceSchema);
