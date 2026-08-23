import mongoose from 'mongoose';

const meadiaSchema = new mongoose.Schema(
  {
    src: {
      type: String,
      required: true,
      unique: true,
    },
    alt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

type MediaType = mongoose.InferSchemaType<typeof meadiaSchema>;
export const Media = mongoose.model<MediaType>('Media', meadiaSchema);
