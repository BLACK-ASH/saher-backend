import mongoose, { Schema } from 'mongoose';

const workshopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'Participant',
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export type WorkshopType = mongoose.InferSchemaType<typeof workshopSchema>;
export const Workshop = mongoose.model<WorkshopType>('Workshop', workshopSchema);
