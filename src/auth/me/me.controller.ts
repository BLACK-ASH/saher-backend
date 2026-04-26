import { Request, Response } from 'express';
import { getUser } from '../../admin/_services/user.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const meController = async (req: Request, res: Response) => {
  const id = req.user?.id;

  const user = await getUser(id!);

  if (!user) {
    res.clearCookie('saher_access_token');
    res.clearCookie('saher_refresh_token');
  }

  return ApiResponse.success(res, {
    message: 'User details',
    data: user,
    statusCode: 200,
  });
};
