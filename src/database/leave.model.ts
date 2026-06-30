import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    leaveTypeCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    proof: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    managerComment: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export type LeaveTypes = mongoose.InferSchemaType<typeof leaveSchema>;
export const Leave = mongoose.model<LeaveTypes>('Leave', leaveSchema);
