import { standardDateString } from './standard-date.js';
import { getWeekRange } from './week-range.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../class/api-error.js';

interface ClaimFlexibleWeekOffInput {
  userId: string;
  date: string | Date;
}

export const claimFlexibleWeekOff = async ({ userId, date }: ClaimFlexibleWeekOffInput) => {
  const selectedDate = new Date(date);

  if (Number.isNaN(selectedDate.getTime())) {
    throw new ApiError(400, 'Invalid date');
  }

  selectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate > today) {
    throw new ApiError(400, 'Future dates cannot be selected');
  }

  if (selectedDate.getDay() === 1) {
    throw new ApiError(400, 'Monday is already fixed week off');
  }

  const { weekStart, weekEnd } = getWeekRange(selectedDate);

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

  if (attendance.status === 'present') {
    throw new ApiError(400, 'Present day cannot be converted to week off');
  }

  if (attendance.status === 'week-off') {
    throw new ApiError(400, 'Already marked as week off');
  }

  attendance.status = 'week-off';
  attendance.weekOffType = 'flexible';

  await attendance.save();

  return attendance;
};
