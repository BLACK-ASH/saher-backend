import type { Request, Response } from 'express';

import { getAccountByUser } from '../../admin/_services/account.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache, deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import { calculateWorkStatus, getShift } from '../../libs/utils/calculate-work-status.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const checkOutController = async (req: Request, res: Response) => {
  const user = req.user;
  const now = new Date();

  if (!user) throw new ApiError(403, 'Forbidden: Unauthorized');

  const attendance = await Attendance.findOneAndUpdate(
    {
      user: user.id,
      date: standardDateString(now),
      inTime: { $ne: null },
      outTime: null,
    },
    { $set: { outTime: now, status: 'present', workHours: 0 } },
    { new: true },
  );

  //  If User Is Not Check In Or Already Checked Out
  if (!attendance) throw new ApiError(400, 'You Have Not Checked in Today or Already Checked Out');

  const account = await getAccountByUser(user.id);
  if (!account) throw new ApiError(400, 'Account not found ');

  const shift = getShift(account);

  if (!attendance.inTime) throw new ApiError(400, 'Intime was not found ');

  const workHoursAndStatus = calculateWorkStatus({
    inTime: attendance.inTime,
    outTime: now,
    shift: shift,
  });

  const workHours = workHoursAndStatus.workHours;

  if (workHours === undefined || workHours === null)
    throw new ApiError(400, 'Work Hours Is Not Valid.');

  let status = workHoursAndStatus.status;

  if (attendance.overtime === true) {
    status = 'present';
  }

  attendance.status = status;
  attendance.workHours = workHours;

  await attendance.save();

  const todayKey = createKey('attendance', 'today', 'me', user?.id);
  await deleteCache(todayKey);

  await deleteCacheGroup('attendance', 'today', 'list');

  return ApiResponse.success(res, {
    message: 'Checked out successfully',
    data: null,
    statusCode: 200,
  });
};
