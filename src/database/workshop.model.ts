import mongoose from "mongoose";
import { required } from "zod/mini";

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

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export type workshopType = mongoose.InferSchemaType<typeof workshopSchema>;
export const Workshop = mongoose.model<workshopType>(
  "Workshop",
  workshopSchema,
);
