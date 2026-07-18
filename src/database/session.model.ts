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
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      // required: true,
    },

    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
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

    images: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Media',
    },

    review: {
      type: String,
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

    bill: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Bill',
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

sessionSchema.index({
  title: 'text',
  description: 'text',
});

export type SessionType = mongoose.InferSchemaType<typeof sessionSchema>;
export const Session = mongoose.model<SessionType>('Session', sessionSchema);

export type SessionAttendanceType = mongoose.InferSchemaType<typeof attendanceSchema>;
export const sessionAttendance = mongoose.model<SessionAttendanceType>(
  'sessionAttendance',
  attendanceSchema,
);
