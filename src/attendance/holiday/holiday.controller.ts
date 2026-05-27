import type { Request, Response } from 'express';

import { Holiday } from '../../database/holiday.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const addHolidayController = async (req: Request, res: Response) => {
  const { date, title, type } = req.body;

  const holiday = await Holiday.create({
    date: date,
    title: title,
    type: type,
  });
  if (!holiday) throw new ApiError(400, 'Holiday record Creation Failed.');

  return ApiResponse.success(res, {
    message: 'The holiday record has been added successful',
    data: holiday.toJSON(),
    statusCode: 201,
  });
};

export const updateHolidayController = async (req: Request, res: Response) => {
  const id = req.params;
  const updateData = req.body;

  const update = await Holiday.findByIdAndUpdate(id, updateData);
  if (!update) throw new ApiError(400, 'Holiday Not Updated.');

  return ApiResponse.success(res, {
    message: 'Holiday Record Updated Successful',
    data: updateData.toJSON(),
    statusCode: 200,
  });
};

export const getHolidayController = async (req: Request, res: Response) => {
  const id = req.params;

  const record = await Holiday.findById(id).lean();
  if (!record) throw new ApiError(404, 'Holiday Record Not Found.');

  return ApiResponse.success(res, {
    message: 'Holiday Retrive Successful',
    data: record,
    statusCode: 200,
  });
};

export const getAllHolidayController = async (req: Request, res: Response) => {
  const holidays = await Holiday.find().lean();
  if (!holidays) throw new ApiError(404, 'No Holiday Records Found.');

  return ApiResponse.success(res, {
    message: 'All Holidays Retrive Successful.',
    data: holidays,
    statusCode: 200,
  });
};

export const deleteHolidayController = async (req: Request, res: Response) => {
  const id = req.params;

  const record = await Holiday.findByIdAndDelete(id);
  if (!record) throw new ApiError(404, 'Holiday Record Not Found.');

  return ApiResponse.success(res, {
    message: 'The Holiday has been deleted successful.',
    data: undefined,
    statusCode: 200,
  });
};
