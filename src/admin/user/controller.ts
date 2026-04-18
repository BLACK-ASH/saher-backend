import { Request, Response } from 'express';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';

export const userGetController = async (req: Request, res: Response) => {
  const id = req.params.id;

  const user = await User.findById(id).populate('image');
  if (!user) throw new ApiError(404, 'User Not Found.');

  return res.status(200).json({
    success: true,
    message: 'User get successfully.',
    data: user,
  });
};

export const getAllUser = async (req: Request, res: Response) => {
  const fields = req.query.fields as string;
  let defaultFields = 'name displayName email image role ';
  if (fields) {
    defaultFields += fields.split(',').join(' ');
  }

  const users = await User.find().populate('image', 'src alt').select(defaultFields).lean();

  return res
    .status(200)
    .json({ success: true, message: 'All User Retrieve Successful.', data: users });
};

export const userUpdateController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const updateInput = req.body;

  const update = await User.findByIdAndUpdate(id, updateInput);
  if (!update) throw new ApiError(404, 'User Not Found.');

  return res.status(200).json({
    success: true,
    message: 'User Update Successfully.',
    data: null,
  });
};

export const userDeleteController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const deleteData = {
    isActive: false,
    deletedAt: new Date(),
    deletedBy: req.user?.id,
  };

  const deleted = await User.findByIdAndUpdate(id, deleteData);
  if (!deleted) throw new ApiError(404, 'User Not Found.');

  return res.status(200).json({
    success: true,
    message: 'User Deleted Successfully.',
    data: null,
  });
};
