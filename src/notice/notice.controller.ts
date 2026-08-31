import type { Request, Response } from 'express';

import { getNoticeSchema } from './notice.schema.js';
import { Notice } from '../database/notice.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';

//Add a Notice
export const addNotice = async (req: Request, res: Response) => {
  const { title, description, expiresAt } = req.body;

  let expiryDate: Date;

  if (expiresAt) {
    expiryDate = new Date(expiresAt);
    expiryDate.setDate(expiryDate.getDate() + 1);
  } else {
    expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const newNotice = await Notice.create({
    title,
    description,
    expiresAt: expiryDate,
  });

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
      isDeleted: false,
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

//Soft Delete Notice
export const deleteNotice = async (req: Request, res: Response) => {
  const notice = await Notice.findById(req.params.id);

  if (!notice || notice.isDeleted) {
    throw new ApiError(404, 'Notice not found');
  }

  notice.isDeleted = true;
  await notice.save();

  return ApiResponse.success(res, {
    message: 'Notice has been deleted successfully',
    data: null,
    statusCode: 200,
  });
};

// Restore Notice
export const restoreNotice = async (req: Request, res: Response) => {
  const notice = await Notice.findById(req.params.id);

  if (!notice || !notice.isDeleted) {
    throw new ApiError(404, 'Deleted notice not found');
  }

  notice.isDeleted = false;
  await notice.save();

  return ApiResponse.success(res, {
    message: 'Notice has been restored successfully',
    data: null,
    statusCode: 200,
  });
};

//Permanent Deletion of Notice (for admin cleanup only)
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

//Get Active Notices (or deleted notices when ?isDeleted=true)
export const getNotices = async (req: Request, res: Response) => {
  const showDeleted = req.query.isDeleted === 'true';

  const filter: Record<string, unknown> = showDeleted
    ? { isDeleted: true }
    : { isDeleted: false, expiresAt: { $gt: new Date() } };

  const notices = await Notice.find(filter).sort({ createdAt: -1 });

  const normalized = notices.map((notice) => normalizeDoc(notice.toObject()));

  const parsed = getNoticeSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Notices fetched successfully',
    data: parsed,
  });
};
