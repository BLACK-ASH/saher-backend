import mongoose, { Schema } from 'mongoose';

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
    },
  },
  { timestamps: true },
);

export type ParticipantType = mongoose.InferSchemaType<typeof participantSchema>;
export const Participant = mongoose.model<ParticipantType>('Participant', participantSchema);
