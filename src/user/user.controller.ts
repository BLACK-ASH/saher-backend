import { Request, Response } from 'express';
import { User } from '../database/user.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { getAccountByUser } from '../admin/_services/account.js';
import { createKey, deleteCache } from '../libs/redis/redis-utils.js';

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

  return res.status(200).json({
    success: true,
    message: 'User Update Successfully.',
    data: null,
  });
};

export const userGetController = async (req: Request, res: Response) => {
  const id = req.user?.id as string;

  const user = await getAccountByUser(id);
  if (!user) throw new ApiError(404, 'User Not Found.');

  return res.status(200).json({
    success: true,
    message: 'User Get Successfully.',
    data: user,
  });
};
