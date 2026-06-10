import type { Request, Response } from 'express';

import { getUser } from '../../admin/_services/user.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const meController = async (req: Request, res: Response) => {
  const id = req.user?.id;

  const user = await getUser(id!);

  if (!user) throw new ApiError(404, 'User Not Found');

  return ApiResponse.success(res, {
    message: 'User details',
    data: user,
    statusCode: 200,
  });
};
