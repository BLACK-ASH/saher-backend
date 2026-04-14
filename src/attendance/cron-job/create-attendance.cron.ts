import { Request, Response } from "express";
import { Attendance } from "../../database/attendance.model.js";
import { ApiError } from "../../libs/class/api-error.js";
import { User } from "../../database/user.model.js";
import { standardDateString } from "../../libs/utils/standard-date.js";

export const createAttendanceCron = async (req: Request, res: Response) => {
  const pass = req.params?.pass;

  // 🔐 Basic protection (replace with ENV later)
  if (pass !== "super") {
    throw new ApiError(403, "Forbidden. You are not allowed to perform this action.");
  }

  // 📅 Today (your existing format)
  const today = standardDateString(new Date());

  // 👥 Get all user IDs
  const users = (await User.find().select("_id").lean()).map((u) =>
    u._id.toString()
  );

  // 📊 Get users who already have attendance today
  const existingAttendance = (
    await Attendance.find({ date: today }).select("user").lean()
  ).map((a) => a.user.toString());

  // ⚡ Convert to Set for fast lookup
  const attendanceSet = new Set(existingAttendance);

  // 🆕 Filter users who need attendance
  const createAttendance = users
    .filter((userId) => !attendanceSet.has(userId))
    .map((userId) => ({
      user: userId,
      date: today,
    }));

  // 🚀 Insert in bulk (ONLY if needed)
  if (createAttendance.length > 0) {
    await Attendance.insertMany(createAttendance);
  }

  // 📊 Counts
  const create = createAttendance.length;
  const skip = users.length - create;

  return res.status(200).json({
    success: true,
    message: "Attendance Created Successfully.",
    data: {
      total: users.length,
      create,
      skip,
    },
  });
};
