import mongoose, { Schema } from "mongoose";
import { required } from "zod/mini";

const participantSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true,
    },

    age: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      required: true,
    },

  //   workshopId: {
  //     type: Schema.Types.ObjectId,
  //     ref: "Workshop",
  //     required: true,
  //   },
  },
  { timestamps: true },
);

export type participantType = mongoose.InferSchemaType<typeof participantSchema>;
export const Participant = mongoose.model<participantType>("Participant", participantSchema,);
