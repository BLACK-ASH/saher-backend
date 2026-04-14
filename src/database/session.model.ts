import mongoose, { Schema } from "mongoose";

//Session attendance
const attendanceSchema = new Schema(
  {
    participant: {
      type: Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },

    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present",
    },

  },
  { _id: false }
);

//Session base schema
const sessionSchema = new mongoose.Schema(
  {
    workshopId: {
      type: Schema.Types.ObjectId,
      ref: "Workshop",
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
      type: Date,
      required: true
    },
    
    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    speaker: {
      type: String,
      required: true,
    },
    attendance: 
      [attendanceSchema],
  },
  { timestamps: true },
);

//Duplicate participant prevention
sessionSchema.path("attendance").validate(function (value: any[]) {
  const ids = value.map(v => v.participant.toString());
  return ids.length === new Set(ids).size;
}, "Duplicate participants in attendance");

export type sessionType = mongoose.InferSchemaType<typeof sessionSchema>;
export const Session = mongoose.model<sessionType>("Session", sessionSchema);

export type sessionAttendanceType = mongoose.InferSchemaType<typeof attendanceSchema>;
export const sessionAttendance = mongoose.model<sessionAttendanceType>("sessionAttendance", attendanceSchema);