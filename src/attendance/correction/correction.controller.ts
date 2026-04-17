import { Request, Response } from 'express';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { Attendance } from '../../database/attendance.model.js';
import {
  AttendanceCorrectionInputType,
  AttendanceCorrectionHandleInputType,
  attendanceRecordSchema,
} from './correction.schema.js';
import { timeDifference } from '../../libs/utils/time-difference.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import mongoose from 'mongoose';
import { removeUndefined } from '../../libs/utils/remove-undefined-value.js';

export const getAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user;

  const requests = await AttendanceCorrection.find({ user: user?.id })
    .populate('user', 'name role')
    .populate('attendance', 'date')
    .populate('proof', 'src alt')
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json({ success: true, message: 'Attendance Correction Retrieve Successful.', data: requests });
};

export const getAttendanceCorrectionById = async (req: Request, res: Response) => {
  const id = req.params.id;
  const request = await AttendanceCorrection.findById(id)
    .populate('user manager', 'name role')
    .populate('attendance', 'date')
    .populate('proof', 'src alt')
    .lean();
  if (!request) throw new ApiError(404, 'Attendance Correction Request Not Found.');
  return res
    .status(200)
    .json({ success: true, message: 'Attendance Correction Retrieve Successful.', data: request });
};

export const getAllAttendanceCorrectionController = async (req: Request, res: Response) => {
  const requests = await AttendanceCorrection.find()
    .populate('user manager', 'name role')
    .populate('attendance', 'date')
    .populate('proof')
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json({ success: true, message: 'Attendance Correction Retrieve Successful.', data: requests });
};

export const createAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user;
  const input: AttendanceCorrectionInputType = req.body;

  if (!user?.id) {
    throw new ApiError(401, 'User not authenticated.');
  }

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
    throw new ApiError(400, 'A Request Already Exists Of This Date.');
  }

  // Parse previous (DB data)
  const previous = attendanceRecordSchema.parse(attendance);

  // Parse changes (input)
  const changesParsed = attendanceRecordSchema.safeParse({
    inTime: input.inTime,
    outTime: input.outTime,
    status: input.status,
    isLate: input.isLate,
  });

  if (!changesParsed.success) {
    throw new ApiError(400, changesParsed.error.message);
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

export const handleAttendanceCorrectionController = async (req: Request, res: Response) => {
  const input: AttendanceCorrectionHandleInputType = req.body;
  const user = req.user;
  const id = req.params.id as string;

  if (!user?.id) {
    throw new ApiError(401, 'User not authenticated.');
  }

  const session = await mongoose.startSession();

  let responsePayload = {};

  try {
    await session.withTransaction(async () => {
      const request = await AttendanceCorrection.findById(id).session(session);
      if (!request) {
        throw new ApiError(404, 'Attendance Correction Request Not Found.');
      }

      // If Request Already Approved
      if (request.status === 'approve')
        throw new ApiError(400, 'Attendance Correction Already Approved.');

      // If Request Already Reject
      if (request.status === 'reject')
        throw new ApiError(400, 'Attendance Correction Is Rejected.');

      // If Attendance Is Reject
      if (input.status === 'reject') {
        request.manager = convertToObjectId(user.id);
        request.status = 'reject';

        if (input.reason?.trim()?.length) {
          request.reason = input.reason?.trim();
        } else {
          request.reason = 'Attendance Correction Has Been Rejected.';
        }

        await request.save({ session });

        responsePayload = { message: 'Attendance Correction Has Been Rejected.', data: null };
        return;
      }

      // If Attendance Is On Hold
      if (input.status === 'on-hold') {
        request.manager = convertToObjectId(user.id);
        request.status = 'on-hold';

        if (input.reason?.trim()?.length) {
          request.reason = input.reason?.trim();
        } else {
          request.reason = 'Attendance Correction Has Been Put On Hold.';
        }

        await request.save({ session });

        responsePayload = { message: 'Attendance Correction Has Been Put On Hold.', data: null };
        return;
      }

      // If Attendance Is Approve
      const attendance = await Attendance.findById(request.attendance).session(session);
      if (!attendance) {
        throw new ApiError(404, 'Attendance Record Not Found.');
      }

      const changes = input.changes || request.changes;

      // ✅ calculate work hours safely
      const workHours =
        changes.inTime && changes.outTime
          ? timeDifference(changes.inTime, changes.outTime).hours
          : null;

      if (workHours === null) {
        throw new ApiError(400, 'Work Hours Is Not Valid.');
      }

      const status = workHours === 0 ? 'absent' : workHours > 5 ? 'present' : 'half-day';

      // ✅ remove undefined fields
      const filteredChanges = removeUndefined(input.changes);

      const newRecord = {
        ...filteredChanges,
        status,
        workHours,
      };

      // ✅ update request
      request.manager = convertToObjectId(user.id);
      request.changes = changes;
      request.status = 'approve';

      if (input.reason?.trim()?.length) {
        request.reason = input.reason?.trim();
      } else {
        request.reason = 'Attendance Correction Approved.';
      }

      await request.save({ session });

      responsePayload = { message: 'Attendance Correction Approve.', data: null };
      // ✅ update attendance
      await Attendance.findByIdAndUpdate(request.attendance, { $set: newRecord }, { session });

      return;
    });

    return res.status(200).json({
      success: true,
      ...responsePayload,
    });
  } finally {
    await session.endSession(); // ✅ always cleanup
  }
};
