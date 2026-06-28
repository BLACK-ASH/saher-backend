import type { Request, Response } from 'express';

import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { getWeekRange } from '../../libs/utils/week-range.js';

export const claimFlexibleWeekOffController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { date } = req.body;

  if (!date) {
    throw new ApiError(400, 'Date is required');
  }

  const selectedDate = new Date(date);

  selectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // future date not allowed
  if (selectedDate > today) {
    throw new ApiError(400, 'Future dates cannot be selected');
  }

  // monday not allowed
  if (selectedDate.getDay() === 1) {
    throw new ApiError(400, 'Monday is already fixed week off');
  }

  const { weekStart, weekEnd } = getWeekRange(selectedDate);

  // already used flexible off?
  const alreadyUsed = await Attendance.findOne({
    user: userId,
    status: 'week-off',
    weekOffType: 'flexible',
    date: {
      $gte: standardDateString(weekStart),
      $lte: standardDateString(weekEnd),
    },
  });

  if (alreadyUsed) {
    throw new ApiError(409, 'Flexible week off already used for this week');
  }

  const attendance = await Attendance.findOne({
    user: userId,
    date: standardDateString(selectedDate),
  });

  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  // validation
  if (attendance.status === 'present') {
    throw new ApiError(400, 'Present day cannot be converted to week off');
  }

  if (attendance.status === 'week-off') {
    throw new ApiError(400, 'Already marked as week off');
  }

  attendance.status = 'week-off';
  attendance.weekOffType = 'flexible';

  await attendance.save();

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Flexible week off claimed successfully',
    data: attendance,
  });
};
