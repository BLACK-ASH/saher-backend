import mongoose, { Schema } from "mongoose";
import { time } from "node:console";
import { required } from "zod/mini";

const sessionSchema = new mongoose.Schema(
  {
    workshopId: {
      type: Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
    
    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    speaker: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export type sessionType = mongoose.InferSchemaType<typeof sessionSchema>;
export const Session = mongoose.model<sessionType>("Session", sessionSchema);
