import mongoose, { Schema } from 'mongoose';

//Session attendance
const attendanceSchema = new Schema(
  {
    participant: {
      type: Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
    },

    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'absent',
    },
  },
  { timestamps: true },
);

//Session base schema
const sessionSchema = new mongoose.Schema(
  {
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      // required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    speaker: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
    },

    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Participant',
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export type SessionType = mongoose.InferSchemaType<typeof sessionSchema>;
export const Session = mongoose.model<SessionType>('Session', sessionSchema);

export type SessionAttendanceType = mongoose.InferSchemaType<typeof attendanceSchema>;
export const sessionAttendance = mongoose.model<SessionAttendanceType>(
  'sessionAttendance',
  attendanceSchema,
);
