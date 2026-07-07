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

export type NoticeType = mongoose.InferSchemaType<typeof noticeSchema>;
export const Notice = mongoose.model<NoticeType>('Notice', noticeSchema);
