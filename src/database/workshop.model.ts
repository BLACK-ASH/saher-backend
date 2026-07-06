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

    program: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

workshopSchema.index({
  title: 'text',
  description: 'text',
});

export type WorkshopType = mongoose.InferSchemaType<typeof workshopSchema>;
export const Workshop = mongoose.model<WorkshopType>('Workshop', workshopSchema);
