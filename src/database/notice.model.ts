import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  expiresAt: {
    type: Date,
  },

  // ponytail: noticeSchema also has a TTL index on expiresAt (auto-purge of stale
  // notices) — that's lifecycle expiry, kept as-is; only user deletes go soft.
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

noticeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type NoticeType = mongoose.InferSchemaType<typeof noticeSchema>;
export const Notice = mongoose.model<NoticeType>('Notice', noticeSchema);
