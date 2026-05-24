import type { Request, Response } from 'express';

import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { generateToken } from '../../libs/utils/jwt-token.js';
import { comparePassword } from '../../libs/utils/password-hash.js';

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const token = {
    accessToken: req.cookies?.saher_access_token,
    refreshToken: req.cookies?.saher_refresh_token,
  };

  if (token.accessToken && token.refreshToken) {
    return ApiResponse.success(res, {
      message: 'Already Login.',
      data: token,
      statusCode: 200,
    });
  }

  const user = await User.findOne({ email }).lean();
  if (!user) throw new ApiError(404, 'User Not Found.');

  const matchPassword = await comparePassword(password, user.password!);
  if (!matchPassword) throw new ApiError(403, 'Invalid Credentials.');

  const payload = { id: user._id.toString(), name: user.name!, role: user.role, email: user.email };

  const { accessToken, refreshToken } = generateToken(payload);

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('saher_access_token', accessToken, {
    maxAge: 604800000,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });

  res.cookie('saher_refresh_token', refreshToken, {
    maxAge: 604800000,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });

  return ApiResponse.success(res, {
    message: 'login succesfully.',
    data: { accessToken, refreshToken },
    statusCode: 200,
  });
};
