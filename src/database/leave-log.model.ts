import mongoose from 'mongoose';

export const leaveActionTypes = [
  'ALLOCATION', // yearly grant
  'LEAVE_APPROVED', // deducted because leave approved
  'LEAVE_CANCELLED', // added back because leave cancelled
  'LEAVE_REJECTED', // added back because approved leave got rejected
  'MANUAL_ADJUSTMENT',
  'CARRY_FORWARD',
] as const;

const leaveLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    leaveCode: {
      type: String,
      required: true,
    },

    year: {
      type: String,
      required: true,
    },

    actionType: {
      type: String,
      enum: leaveActionTypes,
      required: true,
    },

    count: {
      type: Number,
      required: true,
    },

    previousBalance: {
      type: Number,
      required: true,
    },

    newBalance: {
      type: Number,
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const LeaveLog = mongoose.model('LeaveLog', leaveLogSchema);
