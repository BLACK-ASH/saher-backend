import mongoose, { Schema } from "mongoose";
import { number } from "zod";

const participantSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
    },

    gender: {
      type: String,
    },

    phoneNumber: {
      type: String,
      required: true,
    },

    photo: {
      type: String,
    },

    address: {
      type: String,
    },

    affiliation: {
      type: String,
    },

    parentDetails: {
      type: String,
    },

    document: {
      type: String,
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
