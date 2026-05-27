import type { Request, Response } from 'express';

import { ApiResponse } from '../../libs/class/api-response.js';

export const logoutController = (req: Request, res: Response) => {
  res.clearCookie('saher_access_token');
  res.clearCookie('saher_refresh_token');
  return ApiResponse.success(res, {
    message: 'Logout successfully.',
    data: null,
    statusCode: 200,
  });
};
