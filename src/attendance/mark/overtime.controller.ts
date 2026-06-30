import type { Request, Response } from 'express';

import { getAccountByUser } from '../../admin/_services/account.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache, deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import {
  calculateWorkStatus,
  checkIsLate,
  getShift,
} from '../../libs/utils/calculate-work-status.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const overtimeCheckInController = async (req: Request, res: Response) => {
  const user = req.user?.id;
  if (!user) throw new ApiError(400, ' User not found ');
  const today = new Date();
  const todayStr = standardDateString(today);

  const attendance = await Attendance.findOne({
    user: user,
    date: todayStr,
    status: { $in: ['on-leave', 'week-off'] },
  });

  if (!attendance) throw new ApiError(400, 'Today is a working day for you');
  const account = await getAccountByUser(user);
  if (!account) throw new ApiError(400, 'Account not found ');

  const shift = getShift(account);

  const isLate = checkIsLate({ inTime: today, shift });
  if (attendance) {
    attendance.inTime = today;
    attendance.status = 'present';
    attendance.overtime = true;
    attendance.isLate = isLate;
    await attendance.save();

    const todayKey = createKey('attendance', 'today', 'me', user);
    await deleteCache(todayKey);

    await deleteCacheGroup('attendance', 'today', 'list');

    return ApiResponse.success(res, {
      message: 'You have been marked present',
      data: null,
      statusCode: 200,
    });
  }
};

// export const overtimeCheckOutController = async (req : Request , res : Response ) =>{
//     const user = req.user;
//       const now = new Date();

//       if (!user) throw new ApiError(403, 'Forbidden: Unauthorized');

//       const attendance = await Attendance.findOne({
//         user: user?.id,
//         date: standardDateString(now),
//         inTime: { $ne: null },
//       });

//       //  If User Is Not Check In
//       if (!attendance) throw new ApiError(400, 'You Have Not Checked in Today.');
//       // If User Is Already Check Out
//       if (attendance?.outTime) throw new ApiError(400, 'You Have Already Checked Out Today');

//       if (!user?.id) throw new ApiError(400, ' Unauthorized');
//       const account = await getAccountByUser(user?.id);
//       if (!account) throw new ApiError(400, 'Account not found ');

//       const shift = getShift(account);

//       if (!attendance.inTime) throw new ApiError(400, 'Intime was not found ');

//       const workHoursAndStatus = calculateWorkStatus({
//         inTime: attendance.inTime,
//         outTime: now,
//         shift: shift,
//       });

//       const workHours = workHoursAndStatus.workHours;

//       if (workHours === undefined || workHours === null)
//         throw new ApiError(400, 'Work Hours Is Not Valid.');

//       const status = workHoursAndStatus.status;

//       attendance.outTime = now;

//       attendance.status = status;
//       attendance.workHours = workHours;

//       await attendance.save();

//       const todayKey = createKey('attendance', 'today', 'me', user?.id);
//       await deleteCache(todayKey);

//       await deleteCacheGroup('attendance', 'today', 'list');

//       return ApiResponse.success(res, {
//         message: 'Checked out successfully',
//         data: null,
//         statusCode: 200,
//       });
// }
