import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { getRedis } from '../../libs/utils/get-redis.js';
import { setRedis } from '../../libs/utils/set-redis.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { calculateWorkHours } from '../../libs/utils/calculate-work-hours.js';

// export const meAttendanceController = async (req: Request, res: Response) => {
//   const user = req.user;

//   // const cacheKey = `meAttendance:${user?.id}`;

//   // const cachedData = await redisDatabase.get(cacheKey);

//   const cachedData = await getRedis(`meAttendance:${user?.id}`)

//   if (cachedData) {
//     return res
//       .status(200)
//       .json({ success: true, message: 'Data is coming from Redis', data:cachedData });
//   }

//   const now = new Date();
//   const today = await Attendance.findOne({
//     user: user?.id,
//     date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
//   }).lean();

//   if (!today) throw new ApiError(404, 'Today Attendance Not Found.');

//   if (!today.inTime) {
//     throw new ApiError(400, 'You have not checked in yet');
//   }

//   let workHours = today.workHours
//   if (today.workHours === 0) {
//     const employeeDetails = {
//       fullTime: { fullWorkHours: 9, halfWorkHours: 4.5, graceHours: 1, expectedTime: 9 },
//       // partTimeShift1: { fullWorkHours: 4, halfWorkHours: 2, graceHours: 0.5 , expectedTime : 9  },
//       partTime: { fullWorkHours: 4, halfWorkHours: 2, graceHours: 0.5, expectedTime: 2 },
//     };

//     const final =
//       req.user?.employeeType === 'full-time' ? employeeDetails.fullTime : employeeDetails.partTime;

//     const actualWorkHours = Number(timeDifference(today.inTime as Date, now).hours.toFixed(3));
//     const expectedTime = new Date(now);
//     expectedTime.setHours(final.expectedTime, 0, 0, 0);
//     const workHoursFromExpectedTime = Math.max(0,Number(timeDifference(expectedTime, now).hours.toFixed(3)));
//     workHours =
//       actualWorkHours > workHoursFromExpectedTime ? workHoursFromExpectedTime : actualWorkHours;

//     // await redisDatabase.set(cacheKey, JSON.stringify({ ...today, workHours }), { EX: 60 });

//     await setRedis(`meAttendance:${user?.id}`,{...today,workHours},60)
//   }

//   return res
//     .status(200)
//     .json({ success: true, message: `Today Attendance. `, data: { ...today, workHours } });
// };

export const meAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;

  const cacheKeyToday = `attendance:me:${user?.id}:today`;
  const cacheKeyTodayWorkHours = `attendance:me:${user?.id}:today:workHours`;

  let [today, workHours] = await Promise.all([
    getRedis(cacheKeyToday),
    getRedis(cacheKeyTodayWorkHours),
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
    await setRedis(cacheKeyTodayWorkHours, workHours, 60);
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

  await setRedis(cacheKeyToday, today, 14400);

  workHours = today.workHours;
  if (today.workHours === 0) {
    workHours = calculateWorkHours(user?.employeeType, today.inTime);

    await setRedis(cacheKeyTodayWorkHours, workHours, 60);

    return res
      .status(200)
      .json({ message: 'The today and workhours ', success: true, data: { ...today, workHours } });
  }
  return res
    .status(200)
    .json({ message: 'The today and workhours ', success: true, data: { ...today, workHours } });
};
