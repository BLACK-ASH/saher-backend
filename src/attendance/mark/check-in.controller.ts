import type { Request, Response } from 'express';

import { getAccountByUser } from '../../admin/_services/account.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache, deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import { checkIsLate, getShift } from '../../libs/utils/calculate-work-status.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const checkInController = async (req: Request, res: Response) => {
  //Step 1 - Check if the user has token or not
  const user = req.user;
  if (!user?.id) throw new ApiError(400, 'Unauthorized');

  const now = new Date();

  //Step 2 - Check karo ki user ne pehle se aaj ki attendence toh nahi mark kari hai
  const existingRecord = await Attendance.findOne({
    user: user?.id,
    date: standardDateString(now),
    inTime: { $ne: null },
  });
  //Step 3 - Agr haa toh oosko dubara attendence mark karne mat do
  if (existingRecord) throw new ApiError(400, 'You Have Already Check In Today.');

  const account = await getAccountByUser(user?.id);
  if (!account) throw new ApiError(400, 'Account not found ');

  const shift = getShift(account);

  const isLate = checkIsLate({ inTime: now, shift });

  // Updating Cron Record (atomic: only claims a row still absent with no inTime — concurrent double check-ins can't both win)
  const cronRecord = await Attendance.findOneAndUpdate(
    {
      user: user.id,
      status: 'absent',
      date: standardDateString(now),
      inTime: null,
    },
    { $set: { inTime: now, status: 'present', isLate } },
    { new: true },
  );

  // Future Scope : if you want to keep this req hanging for user on leave/weekoff then comment the next line
  if (!cronRecord) throw new ApiError(400, 'Already checked in today or no attendance row exists');

  // Cache invalidation
  const todayKey = createKey('attendance', 'today', 'me', user.id);
  await deleteCache(todayKey);

  await deleteCacheGroup('attendance', 'today', 'list');

  return ApiResponse.success(res, {
    message: 'You have been marked present',
    data: null,
    statusCode: 200,
  });
};
