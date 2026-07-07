import mongoose from 'mongoose';

export const holidayTypes = [
  'national',
  'organizational',
  'optional',
  'other',
  'google',
  'public-holiday',
] as const;

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: holidayTypes,
      default: 'other',
    },
    description: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

type HolidayType = mongoose.InferSchemaType<typeof holidaySchema>;
export const Holiday = mongoose.model<HolidayType>('Holiday', holidaySchema);
