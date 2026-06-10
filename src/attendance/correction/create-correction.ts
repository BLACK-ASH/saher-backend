import type { Request, Response } from 'express';
import { z } from 'zod';

import type { AttendanceCorrectionInputType } from './correction.schema.js';
import { attendanceChangesSchema, attendancePreviousSchema } from './correction.schema.js';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import { notification } from '../../libs/utils/notification.js';

export const createAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user;
  const input: AttendanceCorrectionInputType = req.body;

  if (!user?.id) throw new ApiError(403, 'Forbidden: Action Not Allowed');

  // Check attendance exists
  const attendance = await Attendance.findById(input.attendanceId).lean();
  if (!attendance) {
    throw new ApiError(404, 'User Attendance Not Found.');
  }

  // Check existing pending request
  const exist = await AttendanceCorrection.findOne({
    attendance: input.attendanceId,
    status: 'pending',
  });

  if (exist) {
    throw new ApiError(400, 'A Request Already Under Process Of This Date.');
  }

  // Parse previous (DB data)
  const previous = attendancePreviousSchema.parse(attendance);

  // Parse changes (input)
  const changesParsed = attendanceChangesSchema.safeParse({
    inTime: input.inTime,
    outTime: input.outTime,
  });

  if (!changesParsed.success) {
    throw new ApiError(
      400,
      z.prettifyError(changesParsed.error),
      z.flattenError(changesParsed.error),
    );
  }

  // Create request
  const request = await AttendanceCorrection.create({
    attendance: input.attendanceId,
    user: convertToObjectId(user.id),
    previous,
    changes: changesParsed.data,
    message: input.message,
    proof: input?.proof,
  });

  await deleteCacheGroup('attendance', 'correction');
  const notificationTitle = 'Receieved New Attendance Correction request';
  const notificationDesc = `A new Attendance Correction Request for the date ${attendance.date} has been submitted `;
  await notification.role.success('admin', notificationTitle, notificationDesc);
  await notification.role.success('manager', notificationTitle, notificationDesc);
  return ApiResponse.success(res, {
    message: 'Attendance Correction Request Successful.',
    data: request,
    statusCode: 201,
  });
};
