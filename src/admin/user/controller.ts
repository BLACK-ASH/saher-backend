import { Request, Response } from 'express';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { getAccountByUser } from '../_services/account.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import z from 'zod';
import { userSchemaFinal } from '../_services/user.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';

export const userGetController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const user = await getAccountByUser(id);
  if (!user) throw new ApiError(404, 'User Not Found.');

  return res.status(200).json({
    success: true,
    message: 'User get successfully.',
    data: user,
  });
};

export const getAllUser = async (req: Request, res: Response) => {
  const key = createKey('user', 'list');
  const data = await getCache(key);

  if (data) {
    return res.status(200).json({ success: true, message: 'All User Retrieve Successful.', data });
  }

  const userArraySchema = z.array(userSchemaFinal);
  const users = await User.find().populate('image', 'src alt').lean();

  const normalized = normalizeDoc(users);
  const parsed = userArraySchema.parse(normalized);

  await setCache(key, parsed);

  return res
    .status(200)
    .json({ success: true, message: 'All User Retrieve Successful.', data: parsed });
};

export const userUpdateController = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updateInput = req.body;

  const update = await User.findByIdAndUpdate(id, updateInput);
  if (!update) throw new ApiError(404, 'User Not Found.');

  const key1 = createKey('user', 'list');
  const key2 = createKey('user', id);

  await deleteCache(key1);
  await deleteCache(key2);

  return res.status(200).json({
    success: true,
    message: 'User Update Successfully.',
    data: null,
  });
};

export const userDeleteController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const deleteData = {
    isActive: false,
    deletedAt: new Date(),
    deletedBy: req.user?.id,
  };

  const deleted = await User.findByIdAndUpdate(id, deleteData);
  if (!deleted) throw new ApiError(404, 'User Not Found.');

  const key1 = createKey('user', 'list');
  const key2 = createKey('user', id);

  await deleteCache(key1);
  await deleteCache(key2);

  return res.status(200).json({
    success: true,
    message: 'User Deleted Successfully.',
    data: null,
  });
};
