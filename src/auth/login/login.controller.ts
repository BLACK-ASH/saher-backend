import { Request, Response } from 'express';
import { User } from '../../database/user.model.js';
import { comparePassword } from '../../libs/utils/password-hash.js';
import { generateToken } from '../../libs/utils/jwt-token.js';
import { ApiError } from '../../libs/class/api-error.js';
import { Account } from '../../database/account.model.js';

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const token = {
    accessToken: req.cookies?.saher_access_token,
    refreshToken: req.cookies?.saher_refresh_token,
  };

  if (token.accessToken && token.refreshToken) {
    return res.status(200).json({ success: true, message: 'Already Login.', data: token });
  }

  const user = await User.findOne({ email }).lean();
  if (!user) throw new ApiError(404, 'User Not Found.');

  const matchPassword = await comparePassword(password, user.password!);
  if (!matchPassword) throw new ApiError(403, 'Invalid Credentials.');

  const account = await Account.findOne({ user: user._id }).lean();
  if (!account) throw new ApiError(404, 'Account Not Found.');

  const role = user.role;
  const employeeType = account.employeeType;

  const payload = { id: user._id.toString(), name: user.name!, role, employeeType };

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

  return res
    .status(200)
    .json({ success: true, message: 'login succesfully.', data: { accessToken, refreshToken } });
};
