import { Request, Response } from 'express';
import { User } from '../database/user.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { Account } from '../database/account.model.js';

export const updateUserController = async (req: Request, res: Response) => {
  const id = req.user?.id;
  const updateInput = req.body;

  const update = await User.findByIdAndUpdate(id, updateInput);
  if (!update) throw new ApiError(404, 'User Not Found.');

  return res.status(200).json({
    success: true,
    message: 'User Update Successfully.',
    data: null,
  });
};

export const userGetController = async (req: Request, res: Response) => {
  const id = req.user?.id;

  const user = await Account.find({ user: id })
    .populate({
      path: 'user',
      select: '-password',
      populate: {
        path: 'image',
      },
    })
    .populate('bank aadhar pan resume');
  if (!user) throw new ApiError(404, 'User Not Found.');

  return res.status(200).json({
    success: true,
    message: 'User Get Successfully.',
    data: user,
  });
};
