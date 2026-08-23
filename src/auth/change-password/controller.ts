import crypto from 'crypto';

import type { Request, Response } from 'express';

import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { sendEmail } from '../../libs/mail/resend-send-mail.js';
import { changePasswordTemplate } from '../../libs/mail/templates/change-password.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { notification } from '../../libs/utils/notification.js';
import { hashPassword } from '../../libs/utils/password-hash.js';
import { revokeUserSessions, hashToken } from '../_utils/token.js';

export const changePasswordRequestController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden: Action Not Allowed.');

  const token = crypto.randomBytes(32).toString('hex');
  const url = process.env.BASE_URL + '/change-password?token=' + token;

  const key = createKey('change-password', hashToken(token));

  await setCache(key, user.id, 900);

  const html = changePasswordTemplate({
    name: user?.name,
    url,
    expiryTime: '15 min',
  });

  await sendEmail({ to: user.email, subject: 'Change Password Request.', html });

  return ApiResponse.success(res, {
    message: 'Mail Is Send To Your Registered Email For Verification.',
    data: null,
    statusCode: 200,
  });
};

export const changePasswordController = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const key = createKey('change-password', hashToken(token));

  const userId = await getCache(key);
  if (!userId) throw new ApiError(400, 'Invalid Token Or Token Is Expired.');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User Not Found.');

  const userKey = createKey('user', user._id.toString());

  user.password = await hashPassword(password);
  await user.save();

  await deleteCache(key);
  await deleteCache(userKey);

  // Credential reset revokes every session — stolen sessions can't survive a password change
  await revokeUserSessions(user._id.toString());

  await notification.specific.info(
    [user.id],
    'password change',
    'password change verification mail is send to your Registered email',
  );

  return ApiResponse.success(res, {
    message: 'Password Change Successful.',
    data: null,
    statusCode: 200,
  });
};
