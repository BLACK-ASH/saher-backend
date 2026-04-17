<<<<<<< HEAD
import { Request, Response } from "express";
import { User } from "../../database/user.model.js";
import { ApiError } from "../../libs/class/api-error.js";
=======
import { Request, Response } from 'express';
import { User } from '../../database/user.model.js';
>>>>>>> d72bcf44c4b8e201915ebe08181aea1ace4c2a52

export const getUser = async (id: string) => {
  const user = User.findById(id)
    .populate('image', 'src alt')
    .select('-password -__v -updatedAt')
    .lean();
  return user;
};

export const meController = async (req: Request, res: Response) => {
  const id = req.user?.id;

<<<<<<< HEAD
  const user = await getUser(id!)
  if (!user) throw new ApiError(404, "User Not Found.")
  return res.status(200).json({ success: true, message: "User details", data: user })
}
=======
  const user = await getUser(id!);
  return res.status(200).json({ success: true, message: 'User details', data: user });
};
>>>>>>> d72bcf44c4b8e201915ebe08181aea1ace4c2a52
