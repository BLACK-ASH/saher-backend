import type { Request, Response } from 'express';

import { Attendance } from '../../database/attendance.model.js';
import { Leave } from '../../database/leave.model.js';
import { User } from '../../database/user.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const createAttendanceSync = async () => {
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
    try {
      // ordered:false so one duplicate doesn't abort the batch; concurrent cron triggers race on the unique index
      await Attendance.insertMany(createAttendance, { ordered: false });
    } catch (err) {
      // ponytail: swallow only E11000 dup-key from racing crons — anything else rethrows
      const mongoErr = err as { code?: number; writeErrors?: unknown[] };
      if (
        mongoErr.code !== 11000 &&
        !mongoErr.writeErrors?.some((e) => (e as { code?: number }).code === 11000)
      ) {
        throw err;
      }
    }
  }

  await deleteCacheGroup('today');

  return {
    total: users.length,
    create: createAttendance.length,
    skip: users.length - createAttendance.length,
  };
};

export const createAttendanceCron = async (req: Request, res: Response) => {
  const result = await createAttendanceSync();

  return ApiResponse.success(res, {
    message: 'Attendance Created Successfully',
    data: result,
    statusCode: 200,
  });
};
