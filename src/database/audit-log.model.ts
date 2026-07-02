import mongoose from 'mongoose';

import { settleStatus } from './settlement.model.js';

const auditLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: settleStatus,
    required: true,
  },
});

type AuditLogType = mongoose.InferSchemaType<typeof auditLogSchema>;
export const AuditLog = mongoose.model<AuditLogType>('AuditLog', auditLogSchema);
// audit log
// bill-id:
// date:
// desc/summary:
// amount:
// from:
// to:
