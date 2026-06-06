import mongoose from 'mongoose';

import { User } from './user.model.js';

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  allocatedDays: {
    type: Number,
    required: true,
  },
  maxCarryForwardDays: {
    type: Number,
    required: true,
  },
  requiresProof: {
    type: Boolean,
    default: false,
  },
  minDaysNotice: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
});

export type LeaveTypeType = mongoose.InferSchemaType<typeof leaveTypeSchema>;
export const LeaveType = mongoose.model<LeaveTypeType>('LeaveType', leaveTypeSchema);
