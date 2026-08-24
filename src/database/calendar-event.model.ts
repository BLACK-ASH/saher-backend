import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

type CalendarEvnetType = mongoose.InferSchemaType<typeof calendarEventSchema>;
export const CalendarEvent = mongoose.model<CalendarEvnetType>(
  'CalendarEvent',
  calendarEventSchema,
);
