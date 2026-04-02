import mongoose from "mongoose";

export const holidayTypes = ["national", "organizational", "optional", "other"]

const holidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: holidayTypes,
    default: "other",
  }
}, { timestamps: true })

export type HolidayType = mongoose.InferSchemaType<typeof holidaySchema>
export const Holiday = mongoose.model("Holiday",holidaySchema)
