import { Request, Response } from 'express';

export const revalidateController = (req: Request, res: Response) => {
  // It Should Be Used Together With Protected Route Middleware
  // Protected Route Middleware Already revalidate token and check all the case
  // so i am only sending response of token revalidate if the token is present if not i am sending error

  return res
    .status(200)
    .json({ success: true, message: 'Token revalidate successfully.', data: null });
};
