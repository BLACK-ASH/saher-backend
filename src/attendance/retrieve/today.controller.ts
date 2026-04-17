import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { timeDifference } from '../../libs/utils/time-difference.js';

export const todayAttendanceController = async (req: Request, res: Response) => {
  const today = await Attendance.find().lean();

  if (!today) throw new ApiError(404, 'Today Attendance Not Found.');

  const now = new Date();
  const updatedToday = today.map((record) => {
    let workHours = record.workHours;

    if (record.inTime && !record.outTime) {
      workHours = Number(timeDifference(record?.inTime as Date, now).hours.toFixed(3));
    }
    return { ...record, workHours };
  });

  return res.status(200).json({ success: true, message: 'Today Attendance.', data: updatedToday });
};
