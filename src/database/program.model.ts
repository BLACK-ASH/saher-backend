import mongoose, { Schema } from 'mongoose';

const programSchema = new mongoose.Schema(
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

export type ProgramType = mongoose.InferSchemaType<typeof programSchema>;
export const Program = mongoose.model<ProgramType>('Program', programSchema);
