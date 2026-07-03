import mongoose from 'mongoose';

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
});

type AuditLogType = mongoose.InferSchemaType<typeof auditLogSchema>;
export const AuditLog = mongoose.model<AuditLogType>('AuditLog', auditLogSchema);
