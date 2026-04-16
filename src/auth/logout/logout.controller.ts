import { Request, Response } from 'express';

export const logoutController = (req: Request, res: Response) => {
  res.clearCookie('saher_access_token');
  res.clearCookie('saher_refresh_token');
  return res.status(200).json({ success: 'true', message: 'Logout successfully.', data: null });
};
