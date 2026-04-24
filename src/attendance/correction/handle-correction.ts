import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import { AttendanceCorrectionHandleInputType } from './correction.schema.js';
import { calculateWorkStatus, checkIsLate } from '../../libs/utils/calculate-work-status.js';

export const handleAttendanceCorrectionController = async (req: Request, res: Response) => {
  const input: AttendanceCorrectionHandleInputType = req.body;
  const user = req.user;
  const id = req.params.id as string;

  if (!user?.id) throw new ApiError(403, 'Forbidden: Action Not Allowed');

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
      // let make an empty object to store the change
      // if isAdmin is true then system should calculate the all the attendance status
      const change = input.isAdmin ? input.changes : request.changes!;

      // ✅ calculate work hours safely
      const { workHours, status } = calculateWorkStatus({
        inTime: change.inTime,
        outTime: change.outTime,
        shift: 'free',
      });

      const isLate = input.isAdmin
        ? input.changes.isLate
        : checkIsLate({ inTime: change.inTime, shift: 'free' });

      const newRecord = {
        ...change,
        isLate,
        status,
        workHours,
      };

      // ✅ update request
      request.manager = convertToObjectId(user.id);
      request.changes = change;
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
