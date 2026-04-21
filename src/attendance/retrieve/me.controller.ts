import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
// import { getRedis } from '../../libs/utils/get-redis.js';
// import { setRedis } from '../../libs/utils/set-redis.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { calculateWorkHours } from '../../libs/utils/calculate-work-hours.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import z from 'zod';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { Account } from '../../database/account.model.js';

export const meAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user?.id) throw new ApiError(400, 'Forbidden user');
  // const cacheKeyToday = `attendance:me:${user?.id}:today`;
  const AttendanceSchemaFinal = z
    .object({
      id: z.string(),
      user: z.string(),
      inTime: z.string(),
      outTime: z.string().optional().nullable(),
      workHours: z.number(),
      date: z.string(),
      status: z.string(),
      isLate: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .readonly();

  type AttendanceT = z.infer<typeof AttendanceSchemaFinal>;
  const todayKey = createKey('attendance', 'today', 'me', user?.id);
  // const cacheKeyTodayWorkHours = `attendance:me:${user?.id}:today:workHours`;
  const todayWorkHoursKey = createKey('attendance', 'me', user?.id, 'today', 'workHours');

  const [cachedToday, cachedWorkHours] = await Promise.all([
    getCache<AttendanceT>(todayKey),
    getCache<number>(todayWorkHoursKey),
  ]);

  if (cachedToday && cachedWorkHours) {
    return res.status(200).json({
      message: 'Both data is Coming from Redis ',
      success: true,
      data: { ...cachedToday, workHours: cachedWorkHours },
    });
  }

  // if (!user?.employeeType) throw new ApiError(400, 'Employee type not found');

  if (cachedToday && !cachedWorkHours) {
    const account = await Account.findById(user?.id);
    if (!account) throw new ApiError(400, 'Account not found');
    const workHours = calculateWorkHours(account.employeeType, new Date(cachedToday.inTime));
    // await setCache(todayWorkHoursKey, workHours, 60);
    return res.status(200).json({
      message: 'today from redis , workhours from DB ',
      success: true,
      data: { ...cachedToday, workHours },
    });
  }
  const now = new Date();

  const today = await Attendance.findOne({ user: user?.id, date: standardDateString(now) }).lean();

  if (!today) {
    throw new ApiError(404, 'Today record not found');
  }
  if (!today.inTime) {
    throw new ApiError(400, 'You have not yet checked in ');
  }

  // const serializedToday: AttendanceCacheType = {
  //   ...today,
  //   _id: today._id.toString(),
  //   user: today.user.toString(),
  //   inTime: today.inTime?.toISOString(),
  //   outTime: today.outTime ? today.outTime.toISOString() : null,
  //   createdAt: today.createdAt.toISOString(),
  //   updatedAt: today.updatedAt.toISOString(),
  // };

  const normalize = normalizeDoc(today);
  const parsed = AttendanceSchemaFinal.parse(normalize);
  await setCache(todayKey, parsed, 14400);

  const workHours = today.workHours;
  if (today.workHours === 0) {
    // workHours = calculateWorkHours(user?.employeeType, today.inTime);

    await setCache(todayWorkHoursKey, workHours, 60);

    return res.status(200).json({
      message: 'The today and workhours ',
      success: true,
      data: { ...parsed, workHours },
    });
  }
  return res.status(200).json({
    message: 'The today and workhours ',
    success: true,
    data: { ...parsed, workHours },
  });
};
