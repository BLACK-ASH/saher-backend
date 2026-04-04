import mongoose from "mongoose";

const meadiaSchema = new mongoose.Schema({
  src: {
    type: String,
    require: true,
    unique: true
  },
  alt: {
    type: String,
    require: true
  }
}, {
  timestamps: true
})

type MediaType = mongoose.InferSchemaType<typeof meadiaSchema>
export const Media = mongoose.model<MediaType>("Media", meadiaSchema)


