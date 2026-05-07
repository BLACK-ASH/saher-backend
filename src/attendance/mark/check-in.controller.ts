import type { Request, Response } from 'express';

import { getAccountByUser } from '../../admin/_services/account.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import {
  createGroupKey,
  createKey,
  deleteCache,
  deleteCacheGroup,
} from '../../libs/redis/redis-utils.js';
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

  // Updating Cron Record
  const cronRecord = await Attendance.findOne({
    user: user?.id,
    date: standardDateString(now),
  });

  if (cronRecord) {
    cronRecord.inTime = now;
    cronRecord.status = 'present';
    cronRecord.isLate = isLate;
    await cronRecord.save();

    const todayKey = createKey('attendance', 'today', 'me', user?.id);
    await deleteCache(todayKey);

    const gKey = createGroupKey('attendance', 'today', 'list');
    await deleteCacheGroup(gKey);

    return ApiResponse.success(res, {
      message: 'You have been marked present',
      data: null,
      statusCode: 200,
    });
  }

  // Special case is user is check in before cron job
  //Step 5 - if User exist and have not submitted today's attendence start making new entry
  //Step 6 - Note the current time so that late hai ki nahi ka pata chal     sake
  const newRecord = await Attendance.create({
    user: user?.id,
    inTime: now,
    status: 'present',
    date: standardDateString(now),
    isLate,
  });

  if (!newRecord) throw new ApiError(400, 'Attendance Creation Failed.');

  const todayKey = createKey('attendance', 'today', 'me', user?.id);
  await deleteCache(todayKey);

  const gKey = createGroupKey('attendance', 'today', 'list');
  await deleteCacheGroup(gKey);

  return ApiResponse.success(res, {
    message: 'You have been marked present',
    data: null,
    statusCode: 201,
  });
};
