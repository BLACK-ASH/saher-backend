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
});

noticeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type NoticeType = mongoose.InferSchemaType<typeof noticeSchema>;
export const Notice = mongoose.model<NoticeType>('Notice', noticeSchema);
