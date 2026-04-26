import { Request, Response } from 'express';
import { ApiError } from '../../libs/class/api-error.js';
import { Attendance } from '../../database/attendance.model.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { AttendanceResponseSchema } from './me.controller.js';
import z from 'zod';
import { ApiResponse } from '../../libs/class/api-response.js';

// const AttendanceAllUserSchema = AttendanceSchemaFinal.readonly()

const AttendanceAllUserResponseSchema = z.array(AttendanceResponseSchema).readonly();

export const getAllUserController = async (req: Request, res: Response) => {
  // no matter whether the user want to retrive a custom range or a fixed range(like week/month/year) in every case the retrieve would be done by the startDate and endDate
  let startDate, endDate;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 1;

  const skip = (page - 1) * limit;

  //Agar user ko ek custom range chahiyetoh oos case mein user ko startDate and endDate dono hii banatani padegi
  if (req.query.startDate && req.query.endDate) {
    startDate = new Date(req.query.startDate as string);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(req.query.endDate as string);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate)
      throw new ApiError(400, 'The Datess that you have entered are invalid please check');
  }

  //Agar user ko custom range nahi chahiye toh fir user ke paas option hai ki woh retrieve karne ka type bata de
  else if (req.query.type) {
    const today = new Date();

    endDate = new Date(today);
    if (req.query.type === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    } else if (req.query.type === 'month') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
    } else if (req.query.type === 'year') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 364);
    } else {
      throw new ApiError(400, 'Enter a valid type for retrieving records like week , month , year');
    }
  } else {
    throw new ApiError(
      400,
      'Either you give the type of retriving or you give both start Date and end Date',
    );
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const sort = req.query.sort === 'asc' ? 1 : req.query.sort === 'desc' ? -1 : -1; // default

  //DB Functions
  const record = await Attendance.find({
    date: {
      $gte: standardDateString(startDate),
      $lte: standardDateString(endDate),
    },
  })
    .sort({ date: sort })
    .skip(skip)
    .limit(limit)
    .lean();

  const normalize = normalizeDoc(record);
  const parsed = AttendanceAllUserResponseSchema.parse(normalize);

  const totalRecord = await Attendance.countDocuments({
    date: {
      $gte: standardDateString(startDate),
      $lte: standardDateString(endDate),
    },
  });

  // return res.status(200).json({
  //   message: 'The record you asked for ',
  //   data: parsed,
  //   meta: { page, limit, totalRecord, totalPages: Math.ceil(totalRecord / limit) },
  return ApiResponse.success(res, {
    message: 'The record you asked for ',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, totalRecord, totalPages: Math.ceil(totalRecord / limit) },
  });
};
