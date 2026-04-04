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
    type: String,
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
  },
  autoCheckout: {
    type: Boolean
  }
}, { timestamps: true })

// Adding Index For Fast Lookup
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
type AttendanceType = mongoose.InferSchemaType<typeof attendanceSchema>
export const Attendance = mongoose.model<AttendanceType>("Attendance", attendanceSchema)
