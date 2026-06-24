import mongoose, { Schema } from 'mongoose';

const programmeSchema = new mongoose.Schema(
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

export type ProgrammeType = mongoose.InferSchemaType<typeof programmeSchema>;
export const Programme = mongoose.model<ProgrammeType>('Programme', programmeSchema);
