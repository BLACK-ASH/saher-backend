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

  const attendance = await Attendance.findOne({
    user: user?.id,
    date: standardDateString(now),
    inTime: { $ne: null },
  });

  //  If User Is Not Check In
  if (!attendance) throw new ApiError(400, 'You Have Not Checked in Today.');
  // If User Is Already Check Out
  if (attendance?.outTime) throw new ApiError(400, 'You Have Already Checked Out Today');

  if (!user?.id) throw new ApiError(400, ' Unauthorized');
  const account = await getAccountByUser(user?.id);
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

  const status = workHoursAndStatus.status;

  attendance.outTime = now;
  attendance.status = status;
  attendance.workHours = workHours;

  await attendance.save();

  // const cacheParsed = CheckOutSetCacheSchema.parse(normalized);
  if (!user?.id) throw new ApiError(400, 'Unauthorized');
  const todayKey = createKey('attendance', 'today', 'me', user?.id);
  await deleteCache(todayKey);

  await deleteCacheGroup('attendance', 'today', 'list');

  return ApiResponse.success(res, {
    message: 'Checked out successfully',
    data: null,
    statusCode: 200,
  });
};
