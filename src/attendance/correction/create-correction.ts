import { Request, Response } from 'express';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import { AttendanceCorrectionInputType, attendanceRecordSchema } from './correction.schema.js';
import z from 'zod';

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
  const previous = attendanceRecordSchema.parse(attendance);

  // Parse changes (input)
  const changesParsed = attendanceRecordSchema.safeParse({
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

  return res.status(201).json({
    success: true,
    message: 'Attendance Correction Request Successful.',
    data: request,
  });
};
