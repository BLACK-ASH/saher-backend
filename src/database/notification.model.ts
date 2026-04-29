import mongoose from 'mongoose';

export const notificationTypes = ['Announcement', 'Urgent', 'Reminder', 'Request', 'Task'];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    type: {
      type: String,
      enum: notificationTypes,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

type NotificationType = mongoose.InferSchemaType<typeof notificationSchema>;
export const Notification = mongoose.model<NotificationType>('Notification', notificationSchema);
