import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  inTime: {
    type: Date,
    required: true
  },
  outTime: {
    type: Date,
    default:null
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["present", "absent", "half-day"],
    default: "present"
  },
  isLate: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

export type AttendanceType = mongoose.InferSchemaType<typeof attendanceSchema>
export const Attendance = mongoose.model("Attendence", attendanceSchema)
