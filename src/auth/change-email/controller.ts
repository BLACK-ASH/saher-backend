import crypto from 'crypto';

import type { Request, Response } from 'express';

import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { sendEmail } from '../../libs/mail/resend-send-mail.js';
import { changeEmailTemplate } from '../../libs/mail/templates/change-email-mail.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { notification } from '../../libs/utils/notification.js';
import { hashToken } from '../_utils/token.js';

export const changeEmailRequestController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden: Action Not Allowed.');

  const { email } = req.body; // validated by changeEmailRequestSchema

  // Uniqueness pre-check — email has a unique index; fail here, not on save
  const existing = await User.findOne({ email }).lean();
  if (existing) throw new ApiError(409, 'Email Already In Use.');

  const token = crypto.randomBytes(32).toString('hex');
  const url = process.env.BASE_URL + '/change-email?token=' + token;

  // Verification link goes to the NEW address — only its owner can complete the change
  const key = createKey('change-email', hashToken(token));

  await setCache(key, { userId: user.id, email }, 900);

  const html = changeEmailTemplate({
    name: user?.name,
    url,
    expiryTime: '15 min',
  });

  await sendEmail({ to: email, subject: 'Change Email Request.', html });
  return ApiResponse.success(res, {
    message: 'Mail Is Send To Your New Email Address For Verification.',
    data: null,
    statusCode: 200,
  });
};

export const changeEmailController = async (req: Request, res: Response) => {
  const { token } = req.body; // validated by confirmTokenSchema

  const key = createKey('change-email', hashToken(token));

  const pending = await getCache<{ userId: string; email: string }>(key);
  if (!pending?.userId || !pending.email)
    throw new ApiError(400, 'Invalid Token Or Token Is Expired.');

  const user = await User.findById(pending.userId);
  if (!user) throw new ApiError(404, 'User Not Found.');

  await deleteCache(key); // one-time use

  user.email = pending.email;
  user.emailVerified = false;
  await user.save();

  const key1 = createKey('users', 'list');
  const key2 = createKey('user', user.id);
  const key3 = createKey('account', 'userId', user.id);

  await deleteCache(key1);
  await deleteCache(key2);
  await deleteCache(key3);

  res.clearCookie('saher_access_token');
  res.clearCookie('saher_refresh_token');

  await notification.specific.info(
    [user.id],
    'Change Email ',
    'change email verification mail is send to your Registered email',
  );

  return ApiResponse.success(res, {
    message: 'Email Change Successful.',
    data: null,
    statusCode: 200,
  });
};
