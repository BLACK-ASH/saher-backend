import type { Request, Response } from 'express';
import z from 'zod';

import { holidaySchema } from './holiday.schema.js';
import { Holiday } from '../../database/holiday.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

export const addHolidayController = async (req: Request, res: Response) => {
  const { date, title, type, description } = req.body;

  const existingRecord = await Holiday.find({ date: date, type: type });
  if (existingRecord.length > 0)
    throw new ApiError(
      400,
      'A holiday for the same date with the same type has already been created ',
    );

  const holiday = await Holiday.create({
    date: date,
    title: title,
    type: type,
    description: description,
  });
  if (!holiday) throw new ApiError(400, 'Holiday record Creation Failed.');

  const month = new Date(date).getMonth();
  const year = new Date(date).getFullYear();
  const key = createKey('calendar', year, month);
  // console.log("Holiday key " , key);

  await deleteCache(key);

  return ApiResponse.success(res, {
    message: 'The holiday record has been added successful',
    data: null,
    statusCode: 201,
  });
};

export const updateHolidayController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const updateData = req.body;

  const update = await Holiday.findByIdAndUpdate(id, updateData);
  if (!update) throw new ApiError(400, 'Holiday Not Updated.');

  const month = new Date(update.date).getMonth() + 1;
  const year = new Date(update.date).getFullYear();
  const key = createKey('calendar', year, month);
  await deleteCache(key);

  const normalized = normalizeDoc(update);
  const parsed = holidaySchema.parse(normalized);
  return ApiResponse.success(res, {
    message: 'Holiday Record Updated Successful',
    data: parsed,
    statusCode: 200,
  });
};

export const getHolidayController = async (req: Request, res: Response) => {
  const id = req.params;

  const record = await Holiday.findById(id).lean();
  if (!record) throw new ApiError(404, 'Holiday Record Not Found.');

  const normalized = normalizeDoc(record);
  const parsed = holidaySchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Holiday Retrive Successful',
    data: parsed,
    statusCode: 200,
  });
};

export const getAllHolidayController = async (req: Request, res: Response) => {
  const holidays = await Holiday.find().lean();
  if (!holidays) throw new ApiError(404, 'No Holiday Records Found.');

  const normalized = normalizeDoc(holidays);
  const parsed = z.array(holidaySchema).parse(normalized);
  return ApiResponse.success(res, {
    message: 'All Holidays Retrive Successful.',
    data: parsed,
    statusCode: 200,
  });
};

export const deleteHolidayController = async (req: Request, res: Response) => {
  const id = req.params.id;

  const record = await Holiday.findByIdAndDelete(id);
  if (!record) throw new ApiError(404, 'Holiday Record Not Found.');

  const month = new Date(record.date).getMonth() + 1;
  const year = new Date(record.date).getFullYear();
  const key = createKey('calendar', year, month);
  await deleteCache(key);

  return ApiResponse.success(res, {
    message: 'The Holiday has been deleted successful.',
    data: null,
    statusCode: 200,
  });
};
