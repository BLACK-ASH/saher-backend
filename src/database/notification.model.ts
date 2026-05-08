import mongoose from 'mongoose';

export const notificationTypes = ['info','warn','success','error'];
export const notificationScope = ['user', 'manager' , 'admin' , 'intern', 'specific' , 'global']
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
    scope : {
      type : String ,
      enum : notificationScope ,
      required : true 
    }
  },
  { timestamps: true },
);

type NotificationType = mongoose.InferSchemaType<typeof notificationSchema>;
export const Notification = mongoose.model<NotificationType>('Notification', notificationSchema);
