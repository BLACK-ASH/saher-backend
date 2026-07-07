import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    age: {
      type: Number,
    },

    gender: {
      type: String,
    },

    phoneNumber: {
      type: String,
    },

    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
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
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Media',
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
