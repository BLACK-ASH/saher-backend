import type { Request, Response } from 'express';

import { accountSchemaFinal, getAccountByUser } from '../admin/_services/account.js';
import { User } from '../database/user.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { createKey, deleteCache } from '../libs/redis/redis-utils.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';

export const updateUserController = async (req: Request, res: Response) => {
  const id = req.user?.id as string;
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

export const userGetController = async (req: Request, res: Response) => {
  const id = req.user?.id as string;

  const user = await getAccountByUser(id);
  if (!user) throw new ApiError(404, 'User Not Found.');

  return ApiResponse.success(res, {
    message: 'User Get Successfully.',
    data: user,
    statusCode: 200,
  });
};

export const userSearchController = async (req: Request, res: Response) => {
  const keyword = req.params.keyword as string;

  const regex = new RegExp(keyword, 'i');

  const users = await User.find({
    $or: [
      { name: { $regex: regex } },
      { displayName: { $regex: regex } },
      { email: { $regex: regex } },
    ],
  })
    .select('name displayName email image role')
    .populate('image')
    .limit(5)
    .lean(); // Return top 5 suggestions

  const normalize = normalizeDoc(users);

  return ApiResponse.success(res, {
    message: 'User Get Successfully.',
    data: normalize,
    statusCode: 200,
  });
};
