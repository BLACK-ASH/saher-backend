import { Request, Response } from 'express';
import { getUser } from '../../admin/_services/user.js';

export const meController = async (req: Request, res: Response) => {
  const id = req.user?.id;

  const user = await getUser(id!);

  if (!user) {
    res.clearCookie('saher_access_token');
    res.clearCookie('saher_refresh_token');
  }

  return res.status(200).json({ success: true, message: 'User details', data: user });
};
