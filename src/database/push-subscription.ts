import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      type: {
        p256dh: {
          type: String,
          required: true,
        },
        auth: {
          type: String,
          required: true,
        },
      },
      required: true,
    },
  },
  { timestamps: true },
);

pushSubscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true });

type PushNotificationType = mongoose.InferSchemaType<typeof pushSubscriptionSchema>;

export const PushSubscription = mongoose.model<PushNotificationType>(
  'PushSubscription',
  pushSubscriptionSchema,
);
