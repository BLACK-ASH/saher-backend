import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
// import { getRedis } from '../../libs/utils/get-redis.js';
// import { setRedis } from '../../libs/utils/set-redis.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { calculateWorkHours } from '../../libs/utils/calculate-work-hours.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';

export const meAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user?.id) throw new ApiError(400, 'Forbidden user');
  // const cacheKeyToday = `attendance:me:${user?.id}:today`;
  type AttendanceCacheType = {
    _id: string;
    user: string;
    inTime: string;
    outTime: string | null;
    workHours: number;
    date: string;
    status: string;
    isLate: boolean;
    createdAt: string;
    updatedAt: string;
  };
  const todayKey = createKey('attendance', 'today', 'me', user?.id);
  // const cacheKeyTodayWorkHours = `attendance:me:${user?.id}:today:workHours`;
  const todayWorkHoursKey = createKey('attendance', 'me', user?.id, 'today', 'workHours');

  let [today, workHours] = await Promise.all([
    getCache<AttendanceCacheType>(todayKey),
    getCache<number>(todayWorkHoursKey),
  ]);

  if (today && workHours) {
    return res.status(200).json({
      message: 'Both data is Coming from Redis ',
      success: true,
      data: { ...today, workHours },
    });
  }

  if (!user?.employeeType) throw new ApiError(400, 'Employee type not found');

  if (today && !workHours) {
    workHours = calculateWorkHours(user.employeeType, new Date(today.inTime));
    await setCache(todayWorkHoursKey, workHours, 60);
    return res.status(200).json({
      message: 'today from redis , workhours from DB ',
      success: true,
      data: { ...today, workHours },
    });
  }
  const now = new Date();
  today = await Attendance.findOne({ user: user?.id, date: standardDateString(now) }).lean();

  if (!today) {
    throw new ApiError(404, 'Today record not found');
  }
  if (!today.inTime) {
    throw new ApiError(400, 'You have not yet checked in ');
  }

  await setCache(todayKey, today, 14400);

  workHours = today.workHours;
  if (today.workHours === 0) {
    workHours = calculateWorkHours(user?.employeeType, today.inTime);

    await setCache(todayWorkHoursKey, workHours, 60);

    return res
      .status(200)
      .json({ message: 'The today and workhours ', success: true, data: { ...today, workHours } });
  }
  return res
    .status(200)
    .json({ message: 'The today and workhours ', success: true, data: { ...today, workHours } });
};
