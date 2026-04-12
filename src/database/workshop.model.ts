import mongoose, { Schema } from "mongoose";

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

    participantList: {
      type: [Schema.Types.ObjectId],
      ref: "Participant",
      default: [],
    },
  },
  { timestamps: true },
);

export type workshopType = mongoose.InferSchemaType<typeof workshopSchema>;
export const Workshop = mongoose.model<workshopType>(
  "Workshop",
  workshopSchema,
);
