import type { Request, Response } from 'express';
import mongoose from 'mongoose';

import type { AttendanceCorrectionHandleInputType } from './correction.schema.js';
import { attendanceRecordSchema } from './correction.schema.js';
import { getAccountByUser } from '../../admin/_services/account.js';
import { AttendanceCorrection } from '../../database/attendance-correction.model.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { deleteCacheGroup } from '../../libs/redis/redis-utils.js';
import {
  calculateWorkStatus,
  checkIsLate,
  getShift,
} from '../../libs/utils/calculate-work-status.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import { notificationService } from '../../libs/utils/notification.service.js';

export const handleAttendanceCorrectionController = async (req: Request, res: Response) => {
  const input: AttendanceCorrectionHandleInputType = req.body;
  const user = req.user;
  const id = req.params.id as string;

  if (!user?.id) throw new ApiError(403, 'Forbidden: Action Not Allowed');

  const session = await mongoose.startSession();

  let responsePayload = { message: '', data: null };

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

      // To Handle Approve
      if (input.status === 'reject') {
        request.manager = convertToObjectId(user.id);
        request.status = 'reject';

        if (input.reason?.trim()?.length) {
          request.reason = input.reason?.trim();
        } else {
          request.reason = 'Attendance Correction Has Been Rejected.';
        }

        await request.save({ session });
        const notificationTitle = 'Attendance correction request rejected';
        const notificationDescription = `Your Attendance Correction request of the date ${request.previous.inTime?.getDate()}/${request.previous.inTime?.getMonth()}/${request.previous.inTime?.getFullYear()} has been rejected rejected `;
        await notificationService.specific.info(
          [request.user.toString()],
          notificationTitle,
          notificationDescription,
        );
        responsePayload = { message: 'Attendance Correction Has Been Rejected.', data: null };
        return;
      }

      // To Handle On Hold
      if (input.status === 'on-hold') {
        request.manager = convertToObjectId(user.id);
        request.status = 'on-hold';

        if (input.reason?.trim()?.length) {
          request.reason = input.reason?.trim();
        } else {
          request.reason = 'Attendance Correction Has Been Put On Hold.';
        }

        await request.save({ session });
        const notificationTitle = 'Attendance correction request on-hold';
        const notificationDescription = `Your Attendance Correction request of the date ${request.previous.inTime?.getDate()}/${request.previous.inTime?.getMonth()}/${request.previous.inTime?.getFullYear()} has been kept on-hold `;
        await notificationService.specific.info(
          [request.user.toString()],
          notificationTitle,
          notificationDescription,
        );

        responsePayload = { message: 'Attendance Correction Has Been Put On Hold.', data: null };
        return;
      }

      // To Handle Approve
      const attendance = await Attendance.findById(request.attendance).session(session);
      if (!attendance) {
        throw new ApiError(404, 'Attendance Record Not Found.');
      }

      // If isAdmin is false then system should calculate the all the attendance status if true accept what admin says

      const account = await getAccountByUser(user.id);
      if (!account) throw new ApiError(404, 'User Not Found.');

      const shift = getShift(account);

      const change = input.isAdmin
        ? input.changes!
        : { inTime: request.changes.inTime, outTime: request.changes.outTime };

      //  calculate work hours safely
      const { workHours, status } = calculateWorkStatus({
        inTime: change.inTime,
        outTime: change.outTime,
        shift,
      });

      const isLate = input.isAdmin
        ? input.changes?.isLate
        : checkIsLate({ inTime: change.inTime, shift });

      const newRecord = {
        ...change,
        isLate,
        status: input.isAdmin ? input.changes?.status : status,
        workHours,
      };

      const finalChange = attendanceRecordSchema.parse(newRecord);

      if (!newRecord?.inTime || !newRecord?.outTime) {
        throw new ApiError(400, 'Invalid inTime or outTime');
      }

      //  update request
      request.manager = convertToObjectId(user.id);
      request.changes = finalChange;
      request.status = 'approve';

      if (input.reason?.trim()?.length) {
        request.reason = input.reason?.trim();
      } else {
        request.reason = 'Attendance Correction Approved.';
      }

      await request.save({ session });
      const notificationTitle = 'Attendance correction request approved';
      const notificationDescription = `Your Attendance Correction request of the date ${request.previous.inTime?.getDate()}/${request.previous.inTime?.getMonth()}/${request.previous.inTime?.getFullYear()} has been approved `;
      await notificationService.specific.info(
        [request.user.toString()],
        notificationTitle,
        notificationDescription,
      );
      responsePayload = { message: 'Attendance Correction Approve.', data: null };
      //  update attendance
      await Attendance.findByIdAndUpdate(request.attendance, { $set: newRecord }, { session });

      return;
    });

    await deleteCacheGroup('attendance', 'correction');

    return ApiResponse.success(res, {
      message: responsePayload.message,
      data: responsePayload.data,
      statusCode: 200,
    });
  } finally {
    await session.endSession();
  }
};
