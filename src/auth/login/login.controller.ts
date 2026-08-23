import type { Request, Response } from 'express';

import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { formatMessage } from '../../libs/utils/formatted-message.js';
import { notification } from '../../libs/utils/notification.js';
import { comparePassword } from '../../libs/utils/password-hash.js';
import { getSessionMeta } from '../_utils/session-meta.js';
import { generateToken } from '../_utils/token.js';
import { COOKIE_OPTIONS } from '../refresh/refresh.controller.js';

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

  // Same generic 401 + constant bcrypt work whether user exists or not (anti-enumeration / anti-timing)
  const DUMMY_HASH = '$2b$10$3euPcmQFCiblsZeEu5s7p.9OVHgeHWFDk9nhMqZ0m/3pd/lhwZugm';
  if (!user) {
    await comparePassword(password, DUMMY_HASH);
    throw new ApiError(401, 'Invalid Credentials.');
  }

  const matchPassword = await comparePassword(password, user.password);
  if (!matchPassword) throw new ApiError(401, 'Invalid Credentials.');

  // Email verification is enforced — unverified accounts cannot log in
  if (!user.emailVerified) throw new ApiError(403, 'Please verify your email before logging in.');

  const payload = { id: user._id.toString(), name: user.name, role: user.role, email: user.email };

  const meta = await getSessionMeta(req);

  const { accessToken, refreshToken, sessionId } = await generateToken(payload, meta);

  res.cookie('saher_access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('saher_refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 24 * 60 * 60 * 1000,
  });

  res.cookie('saher_session_id', sessionId, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 24 * 60 * 60 * 1000,
  });
  const desc = `user login from ${meta.device} using ${meta.browser}`;
  await notification.specific.info([user._id.toString()], 'User Login', formatMessage(desc));

  return ApiResponse.success(res, {
    message: 'login succesfully.',
    data: { accessToken, refreshToken, sessionId },
    statusCode: 200,
  });
};
