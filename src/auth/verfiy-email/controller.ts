import crypto from 'crypto';

import type { Request, Response } from 'express';

import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { sendEmail } from '../../libs/mail/resend-send-mail.js';
import { verifyEmailTemplate } from '../../libs/mail/templates/verify-mail.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { formatMessage } from '../../libs/utils/formatted-message.js';
import { notification } from '../../libs/utils/notification.js';
import { hashToken } from '../_utils/token.js';

export const verifyEmailRequestController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden: Action Not Allowed.');

  const token = crypto.randomBytes(32).toString('hex');
  const verifyUrl = process.env.BASE_URL + '/verify-email?token=' + token;

  const key = createKey('email-verification', hashToken(token));

  await setCache(key, user.id, 900);

  const html = verifyEmailTemplate({ name: user?.name, verifyUrl, expiryTime: '15 min' });

  await sendEmail({ to: user.email, subject: 'Email Verification Request.', html });

  return ApiResponse.success(res, {
    message: 'Mail Is Send To Your Registered Email For Verification.',
    data: null,
    statusCode: 200,
  });
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const { token } = req.body;

  const key = createKey('email-verification', hashToken(token));

  const userId = await getCache<string>(key);
  if (!userId) throw new ApiError(400, 'Invalid Token Or Token Is Expired.');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User Not Found.');

  // One-time use — delete token so it can't be replayed within its 15-min TTL
  await deleteCache(key);

  user.emailVerified = true;
  await user.save();

  const key1 = createKey('users', 'list');
  const key2 = createKey('user', userId);
  const key3 = createKey('account', 'userId', userId);

  await deleteCache(key1);
  await deleteCache(key2);
  await deleteCache(key3);

  await notification.specific.info(
    [user.id],
    'Email Verification',
    formatMessage('verification mail is send to your Registered Email'),
  );

  return ApiResponse.success(res, {
    message: 'Email Verification Successful.',
    data: null,
    statusCode: 200,
  });
};
