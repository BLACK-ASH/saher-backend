import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { timeDifference } from '../../libs/utils/time-difference.js';
import { redisDatabase } from '../../redis/client.js';

export const meAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;

  const cacheKey = `meAttendance:${user?.id}`;

  const cachedData = await redisDatabase.get(cacheKey);

  if (cachedData) {
    return res
      .status(200)
      .json({ success: true, message: 'Data is coming from Redis', data: JSON.parse(cachedData) });
  }

  const now = new Date();
  const today = await Attendance.findOne({
    user: user?.id,
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
  }).lean();

  if (!today) throw new ApiError(404, 'Today Attendance Not Found.');

  if (!today.inTime) {
    throw new ApiError(400, 'You have not checked in yet');
  }

  let workHours;
  if (today.workHours === 0) {
    const employeeDetails = {
      fullTime: { fullWorkHours: 9, halfWorkHours: 4.5, graceHours: 1, expectedTime: 9 },
      // partTimeShift1: { fullWorkHours: 4, halfWorkHours: 2, graceHours: 0.5 , expectedTime : 9  },
      partTime: { fullWorkHours: 4, halfWorkHours: 2, graceHours: 0.5, expectedTime: 2 },
    };

    const final =
      req.user?.employeeType === 'full-time' ? employeeDetails.fullTime : employeeDetails.partTime;

    const actualWorkHours = Number(timeDifference(today.inTime as Date, now).hours.toFixed(3));
    const expectedTime = new Date(now);
    expectedTime.setHours(final.expectedTime, 0, 0, 0);
    const workHoursFromExpectedTime = Number(timeDifference(expectedTime, now).hours.toFixed(3));

    workHours =
      actualWorkHours > workHoursFromExpectedTime ? workHoursFromExpectedTime : actualWorkHours;

    await redisDatabase.set(cacheKey, JSON.stringify({ ...today, workHours }), { EX: 60 });
  }

  return res
    .status(200)
    .json({ success: true, message: 'Today Attendance.', data: { ...today, workHours } });
};
