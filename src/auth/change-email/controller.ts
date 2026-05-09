import crypto from 'crypto';

import type { Request, Response } from 'express';

import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { sendEmail } from '../../libs/mail/resend-send-mail.js';
import { changeEmailTemplate } from '../../libs/mail/templates/change-email-mail.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';

export const changeEmailRequestController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden: Action Not Allowed.');

  const token = crypto.randomBytes(32).toString('hex');
  const url = process.env.BASE_URL + '/change-email?token=' + token;

  const key = createKey('change-email', token);

  await setCache(key, user.id, 900);

  const html = changeEmailTemplate({
    name: user?.name,
    url,
    expiryTime: '15 min',
  });

  await sendEmail({ to: user.email, subject: 'Change Email Request.', html });
  return ApiResponse.success(res, {
    message: 'Mail Is Send To Your Registered Email For Verification.',
    data: null,
    statusCode: 200,
  });
};

export const changeEmailController = async (req: Request, res: Response) => {
  const { token, email } = req.body;

  const key = createKey('change-email', token);

  const userId = await getCache(key);
  if (!userId) throw new ApiError(400, 'Invalid Token Or Token Is Expired.');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User Not Found.');

  const userKey = createKey('user', user._id.toString());
  const userKey2 = createKey('account', 'userId', user._id.toString());

  user.email = email;
  user.emailVerified = false;
  await user.save();

  await deleteCache(key);
  await deleteCache(userKey);
  await deleteCache(userKey2);

  res.clearCookie('saher_access_token');
  res.clearCookie('saher_refresh_token');

  return ApiResponse.success(res, {
    message: 'Email Change Successful.',
    data: null,
    statusCode: 200,
  });
};
