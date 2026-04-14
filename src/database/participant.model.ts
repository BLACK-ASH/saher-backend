import mongoose, { Schema } from "mongoose";

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

    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true },
);

export type participantType = mongoose.InferSchemaType<typeof participantSchema>;
export const Participant = mongoose.model<participantType>("Participant", participantSchema,);
