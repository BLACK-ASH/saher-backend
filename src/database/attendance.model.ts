import mongoose from "mongoose";

export const attendanceStatus = ["present", "absent", "half-day"]

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  inTime: {
    type: Date,
    default: null
  },
  outTime: {
    type: Date,
    default: null
  },
  workHours: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: attendanceStatus,
    default: "absent"
  },
  isLate: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

type AttendanceType = mongoose.InferSchemaType<typeof attendanceSchema>
export const Attendance = mongoose.model<AttendanceType>("Attendance", attendanceSchema)
