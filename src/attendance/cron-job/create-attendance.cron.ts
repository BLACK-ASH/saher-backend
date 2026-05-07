import type { Request, Response } from 'express';

import { Attendance } from '../../database/attendance.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import 'dotenv/config';
import { deleteCacheGroup } from '../../libs/redis/redis-utils.js';

export const createAttendanceCron = async (req: Request, res: Response) => {
  const pass = req.params?.pass;

  // 🔐 Basic protection (replace with ENV later)
  if (pass !== process.env.CRON_SECRET) {
    throw new ApiError(403, 'Forbidden. You are not allowed to perform this action.');
  }

  // 📅 Today (your existing format)
  const today = standardDateString(new Date());

  // 👥 Get all user IDs
  const users = (await User.find().select('_id').lean()).map((u) => u._id.toString());

  // 📊 Get users who already have attendance today
  const existingAttendance = (await Attendance.find({ date: today }).select('user').lean()).map(
    (a) => a.user.toString(),
  );

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

  await deleteCacheGroup('today');

  return ApiResponse.success(res, {
    message: 'Attendance Created Successfully.',
    data: {
      total: users.length,
      create,
      skip,
    },
    statusCode: 200,
  });
};
