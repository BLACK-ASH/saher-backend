import type { Request, Response } from 'express';

import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { formatMessage } from '../../libs/utils/formatted-message.js';
import { notification } from '../../libs/utils/notification.js';
import { comparePassword } from '../../libs/utils/password-hash.js';
import { getSessionMeta } from '../_utils/session-meta.js';
import { generateToken } from '../_utils/token.js';

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

  const matchPassword = await comparePassword(password, user.password);
  if (!matchPassword) throw new ApiError(403, 'Invalid Credentials.');

  const payload = { id: user._id.toString(), name: user.name, role: user.role, email: user.email };

  const meta = await getSessionMeta(req);

  const { accessToken, refreshToken, sessionId } = await generateToken(payload, meta);

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('saher_access_token', accessToken, {
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });

  res.cookie('saher_refresh_token', refreshToken, {
    maxAge: 60 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });

  res.cookie('saher_session_id', sessionId, {
    maxAge: 60 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });

  const desc = `user login from ${meta.device} using ${meta.browser}`;
  await notification.specific.info([user._id.toString()], 'User Login', formatMessage(desc));

  return ApiResponse.success(res, {
    message: 'login succesfully.',
    data: { accessToken, refreshToken, sessionId },
    statusCode: 200,
  });
};
