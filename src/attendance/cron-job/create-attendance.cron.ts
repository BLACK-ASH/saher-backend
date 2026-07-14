import type { Request, Response } from 'express';

import { Attendance } from '../../database/attendance.model.js';
import { Leave } from '../../database/leave.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

import 'dotenv/config';

export const createAttendanceCron = async (req: Request, res: Response) => {
  const pass = req.params?.pass;

  if (pass !== process.env.CRON_SECRET && req.user?.role !== 'admin') {
    throw new ApiError(403, 'Forbidden. You are not allowed to perform this action');
  }

  const todayDate = new Date();
  const today = standardDateString(todayDate);

  // const isMonday = todayDate.getDay() === 1;

  const startOfDay = new Date(todayDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(todayDate);
  endOfDay.setHours(23, 59, 59, 999);

  const users = (await User.find().select('_id').lean()).map((u) => u._id.toString());

  const existingAttendance = (await Attendance.find({ date: today }).select('user').lean()).map(
    (a) => a.user.toString(),
  );

  const attendanceSet = new Set(existingAttendance);

  const usersOnLeave = await Leave.find({
    status: 'approved',
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
  })
    .select('user')
    .lean();

  const leaveSet = new Set(usersOnLeave.map((l) => l.user.toString()));

  const createAttendance = users
    .filter((userId) => !attendanceSet.has(userId))
    .map((userId) => {
      let status = 'absent';
      // let weekOffType: 'fixed' | 'flexible' | null = null;

      if (leaveSet.has(userId)) {
        status = 'on-leave';
      }

      return {
        user: userId,
        date: today,
        status,
        // weekOffType,
      };
    });

  if (createAttendance.length > 0) {
    await Attendance.insertMany(createAttendance);
  }

  const create = createAttendance.length;
  const skip = users.length - create;

  await deleteCacheGroup('today');

  return ApiResponse.success(res, {
    message: 'Attendance Created Successfully',
    data: {
      total: users.length,
      create,
      skip,
    },
    statusCode: 200,
  });
};
