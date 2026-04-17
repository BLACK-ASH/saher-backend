import { Request, Response } from 'express';
import { Holiday } from '../../database/holiday.model.js';
import { ApiError } from '../../libs/class/api-error.js';

export const addHolidayController = async (req: Request, res: Response) => {
  const { date, title, type } = req.body;

  const holiday = await Holiday.create({
    date: date,
    title: title,
    type: type,
  });
  if (!holiday) throw new ApiError(400, 'Holiday record Creation Failed.');

  return res.status(201).json({
    success: true,
    message: 'The holiday record has been added successful',
    data: holiday.toJSON(),
  });
};

export const updateHolidayController = async (req: Request, res: Response) => {
  const id = req.params;
  const updateData = req.body;

  const update = await Holiday.findByIdAndUpdate(id, updateData);
  if (!update) throw new ApiError(400, 'Holiday Not Updated.');

  return res.status(200).json({
    message: 'Holiday Record Updated Successful',
    success: true,
    data: updateData.toJSON(),
  });
};

export const getHolidayController = async (req: Request, res: Response) => {
  const id = req.params;

  const record = await Holiday.findById(id).lean();
  if (!record) throw new ApiError(404, 'Holiday Record Not Found.');

  return res
    .status(200)
    .json({ message: 'Holiday Retrive Successful', success: true, data: record });
};

export const getAllHolidayController = async (req: Request, res: Response) => {
  const holidays = await Holiday.find().lean();
  if (!holidays) throw new ApiError(404, 'No Holiday Records Found.');

  return res
    .status(200)
    .json({ message: 'All Holidays Retrive Successful.', data: holidays, success: true });
};

export const deleteHolidayController = async (req: Request, res: Response) => {
  const id = req.params;

  const record = await Holiday.findByIdAndDelete(id);
  if (!record) throw new ApiError(404, 'Holiday Record Not Found.');

  return res
    .status(200)
    .json({ message: 'The Holiday has been deleted successful.', success: true });
};
