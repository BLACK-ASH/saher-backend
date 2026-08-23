import type { Request, Response } from 'express';
import z from 'zod';

import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { getAccountByUser } from '../_services/account.js';
import { userSchemaFinal } from '../_services/user.js';

export const userGetController = async (req: Request, res: Response) => {
  const id = req.params.id.toString().trim();
  // Get Current User If Id Not Provided
  const isSelf = id === 'me';
  const userId = isSelf ? (req.user?.id as string) : id;

  // Non-admins may only read their own record (KYC data rides on account populate)
  if (!isSelf && req.user?.role !== 'admin' && req.user?.role !== 'manager') {
    throw new ApiError(403, 'Forbidden.');
  }

  const user = await getAccountByUser(userId);
  if (!user) throw new ApiError(404, 'User Not Found.');

  return ApiResponse.success(res, {
    message: 'User get successfully.',
    data: user,
    statusCode: 200,
  });
};

export const getAllUsersController = async (req: Request, res: Response) => {
  const key = createKey('users', 'list');
  const data = await getCache(key);

  if (data) {
    return ApiResponse.success(res, {
      message: 'All User Retrieve Successful.',
      data: data,
      statusCode: 200,
    });
  }

  const userArraySchema = z.array(userSchemaFinal);
  const users = await User.find().populate('image', 'src alt').lean();

  const normalized = normalizeDoc(users);
  const parsed = userArraySchema.parse(normalized);

  await setCache(key, parsed, 604800);

  return ApiResponse.success(res, {
    message: 'All User Retrieve Successful.',
    data: parsed,
    statusCode: 200,
  });
};

export const userUpdateController = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updateInput = req.body;

  const update = await User.findByIdAndUpdate(id, updateInput);
  if (!update) throw new ApiError(404, 'User Not Found.');

  const key1 = createKey('users', 'list');
  const key2 = createKey('user', id);
  const key3 = createKey('account', 'userId', id);

  await deleteCache(key1);
  await deleteCache(key2);
  await deleteCache(key3);

  return ApiResponse.success(res, {
    message: 'User Update Successfully.',
    data: null,
    statusCode: 200,
  });
};

export const userDeleteController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const admin = req.user;
  if (!admin) throw new ApiError(403, 'Forbidden');

  if (String(id) === String(admin.id)) {
    throw new ApiError(400, 'You Cannot Delete Yourself');
  }

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User Not Found.');

  const key1 = createKey('users', 'list');
  const key2 = createKey('user', id);

  if (!user.isActive) {
    await User.findByIdAndDelete(id);

    await deleteCache(key1);
    await deleteCache(key2);

    return ApiResponse.success(res, {
      message: 'User Deleted Successfully.',
      data: null,
      statusCode: 200,
    });
  }

  user.isActive = false;
  user.deletedAt = new Date();
  user.deletedBy = convertToObjectId(admin.id);
  await user.save();

  await deleteCache(key1);
  await deleteCache(key2);

  return ApiResponse.success(res, {
    message: 'User Deleted Successfully.',
    data: null,
    statusCode: 200,
  });
};

export const userRestoreController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const admin = req.user;
  if (!admin) {
    throw new ApiError(403, 'Forbidden');
  }

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, 'User Not Found.');
  }

  if (!user.deletedAt) {
    throw new ApiError(400, 'User is not deleted.');
  }

  user.isActive = true;
  user.deletedAt = null;
  user.deletedBy = null;

  await user.save();

  const listKey = createKey('users', 'list');
  const userKey = createKey('user', id);

  await Promise.all([deleteCache(listKey), deleteCache(userKey)]);

  return ApiResponse.success(res, {
    message: 'User Restored Successfully.',
    data: null,
    statusCode: 200,
  });
};
