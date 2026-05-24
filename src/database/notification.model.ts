// import mongoose from 'mongoose';

// export const notificationTypes = ['info','warn','success','error'];
// export const notificationScope = ['user', 'manager' , 'admin' , 'intern', 'specific' , 'global']
// const notificationSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: false,
//     },
//     type: {
//       type: String,
//       enum: notificationTypes,
//       required: true,
//     },
//     title: {
//       type: String,
//       required: true,
//     },
//     description: {
//       type: String,
//     },
//     scope : {
//       type : String ,
//       enum : notificationScope ,
//       required : true
//     }
//   },
//   { timestamps: true },
// );

// type NotificationType = mongoose.InferSchemaType<typeof notificationSchema>;
// export const Notification = mongoose.model<NotificationType>('Notification', notificationSchema);

import mongoose from 'mongoose';

export const notificationTypes = ['info', 'warn', 'success', 'error'] as const;

export const notificationScope = [
  'user',
  'manager',
  'admin',
  'intern',
  'specific',
  'global',
] as const;

const notificationSchema = new mongoose.Schema(
  {
    // 👤 target user (optional for global/scope-based notifications)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    // 📌 type of notification
    type: {
      type: String,
      enum: notificationTypes,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    // 🎯 delivery scope
    scope: {
      type: String,
      enum: notificationScope,
      required: true,
      index: true,
    },

    // 👀 seen/unseen state
    isSeen: {
      type: Boolean,
      default: false,
      index: true,
    },

    seenAt: {
      type: Date,
      default: null,
    },

    // ⏳ auto cleanup support (Mongo TTL)
    expiresAt: {
      type: Date,
    },

    // ⚡ user action (UI behavior)
    action: {
      type: {
        type: String,
        enum: ['download', 'navigate', 'external', 'none'],
        default: 'none',
      },

      label: {
        type: String, // button text like "View", "Download"
      },

      url: {
        type: String, // route or external link
      },

      method: {
        type: String,
        enum: ['GET', 'POST'],
        default: 'GET',
      },
    },

    // 📦 optional system context
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// 🧹 MongoDB TTL auto-delete
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

type NotificationType = mongoose.InferSchemaType<typeof notificationSchema>;

export const Notification = mongoose.model<NotificationType>('Notification', notificationSchema);
