import { Request, Response } from 'express';
import crypto from 'crypto';
import { verifyEmailTemplate } from '../../libs/mail/templates/verify-mail.js';
import { ApiError } from '../../libs/class/api-error.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { User } from '../../database/user.model.js';
import { sendEmail } from '../../libs/mail/resend-send-mail.js';

export const verifyEmailRequestController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden: Action Not Allowed.');

  const token = crypto.randomBytes(32).toString('hex');
  const verifyUrl = process.env.BASE_URL + '/auth/verify-email?token=' + token;

  const key = createKey('email-verification', token);

  await setCache(key, user.id, 900);

  const html = verifyEmailTemplate({ name: user?.name, verifyUrl, expiryTime: '15 min' });

  await sendEmail({ to: user.email, subject: 'Email Verification Request.', html });

  return res.status(200).json({
    success: true,
    message: 'Mail Is Send To Your Registered Email For Verification.',
    data: null,
  });
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const { token } = req.body;

  const key = createKey('email-verification', token);

  const userId = await getCache(key);
  if (!userId) throw new ApiError(400, 'Invalid Token Or Token Is Expired.');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User Not Found.');

  const userKey = createKey('user', user._id.toString());

  user.emailVerified = true;
  await user.save();

  await deleteCache(key);
  await deleteCache(userKey);

  return res.status(200).json({
    success: true,
    message: 'Email Verification Successful.',
    data: null,
  });
};
