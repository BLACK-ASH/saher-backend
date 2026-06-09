import type { Request, Response } from 'express';

import { Notice } from '../database/notice.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';

//Add a Notice
export const addNotice = async (req: Request, res: Response) => {
  const newNotice = await Notice.create(req.body);

  return ApiResponse.success(res, {
    message: 'Notice has been added successfully',
    data: newNotice,
    statusCode: 201,
  });
};

//Edit a Notice
export const editNotice = async (req: Request, res: Response) => {
  const updatedNotice = await Notice.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    req.body,
    {
      new: false,
      runValidators: false,
    },
  );

  if (!updatedNotice) {
    throw new ApiError(404, 'Notice not found');
  }

  return ApiResponse.success(res, {
    message: 'Notice has been updated successfully',
    data: updatedNotice,
  });
};

//Permanent Deletion of Notice
export const permanentDeleteNotice = async (req: Request, res: Response) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);

  if (!notice) {
    throw new ApiError(404, 'Notice not found');
  }

  return ApiResponse.success(res, {
    message: 'Notice has been permanently deleted successfully',
    data: null,
    statusCode: 200,
  });
};
