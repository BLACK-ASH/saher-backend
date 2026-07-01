import type { Request, Response } from 'express';

import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { claimFlexibleWeekOff } from '../../libs/utils/flexible-week-off.js';

export const claimFlexibleWeekOffController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const date = req.body.date ? new Date(req.body.date) : new Date();

  const attendance = await claimFlexibleWeekOff({
    userId,
    date: date,
  });

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Flexible week off claimed successfully',
    data: attendance,
  });
};
