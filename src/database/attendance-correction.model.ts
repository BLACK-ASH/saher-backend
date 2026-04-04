import mongoose from "mongoose";

const attendanceRecord = new mongoose.Schema({
  inTime: {
    type: Date,
  },
  outTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["present", "absent", "half-day"],
  },
  isLate: {
    type: Boolean,
  }
})

export const attendanceRequestStatus = ["pending", "approve", "reject"]

const attendanceCorrectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendance",
  },
  previous: attendanceRecord,
  changes: attendanceRecord,
  status: {
    type: String,
    enum: attendanceRequestStatus,
    default: "pending"
  },
  message: {
    type: String,
    required: true
  },
  // By Manager Of Status
  reason: {
    type: String,
    default: "Request Is Under Processing"
  },
  proof: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Media",
  },
}, { timestamps: true })

attendanceCorrectionSchema.index({ attendance: 1, status: 1 }, { unique: true });
type AttendanceCorrectionType = mongoose.InferSchemaType<typeof attendanceCorrectionSchema>
export const AttendanceCorrection = mongoose.model<AttendanceCorrectionType>("AttendenceCorrection", attendanceCorrectionSchema)

