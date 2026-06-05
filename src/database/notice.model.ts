import mongoose, { Schema } from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  createdBy: {
    type: String,
    required: true,
  },
});

export type NoticeType = mongoose.InferSchemaType<typeof noticeSchema>;
export const Notice = mongoose.model<NoticeType>('Notice', noticeSchema);
