import { Request, Response } from 'express';
import crypto from 'crypto';
import { ApiError } from '../../libs/class/api-error.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { User } from '../../database/user.model.js';
import { sendEmail } from '../../libs/mail/resend-send-mail.js';
import { hashPassword } from '../../libs/utils/password-hash.js';
import z from 'zod';
import { forgotPasswordTemplate } from '../../libs/mail/templates/forgot-password.js';

export const forgotPasswordRequestController = async (req: Request, res: Response) => {
  const { email } = req.body;

  const emailInput = z.email();

  const parsedEmail = emailInput.safeParse(email);
  if (!parsedEmail.success) throw new ApiError(400, 'Invalid Email Address');

  const token = crypto.randomBytes(32).toString('hex');
  const url = process.env.BASE_URL + '/forgot-password?token=' + token;

  const key = createKey('forgot-password', token);

  await setCache(key, parsedEmail.data, 900);

  const html = forgotPasswordTemplate({
    name: 'user',
    url,
    expiryTime: '15 min',
  });

  await sendEmail({ to: parsedEmail.data, subject: 'forgot Password Request.', html });

  return res.status(200).json({
    success: true,
    message: 'Mail Is Send To Your Registered Email For Verification.',
    data: null,
  });
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const key = createKey('forgot-password', token);

  const email = await getCache(key);
  if (!email) throw new ApiError(400, 'Invalid Token Or Token Is Expired.');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User Not Found.');

  const userKey = createKey('user', user._id.toString());

  user.password = await hashPassword(password);
  await user.save();

  await deleteCache(key);
  await deleteCache(userKey);

  return res.status(200).json({
    success: true,
    message: 'Password Change Successful.',
    data: null,
  });
};
