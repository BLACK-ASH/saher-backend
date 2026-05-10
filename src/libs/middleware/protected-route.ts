import { NextFunction, Request, Response } from 'express';
import {
  generateToken,
  ReqUser,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt-token.js';
import { ApiError } from '../class/api-error.js';

export const protectedRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const access = req.cookies?.saher_access_token;
    const refresh = req.cookies?.saher_refresh_token;
    const isProd = process.env.NODE_ENV === 'production';

    if (!access) {
      if (!refresh) {
        throw new ApiError(401, 'Login Required.');
      }

      const verifyToken = await verifyRefreshToken(refresh);
      if (!verifyToken) {
        throw new ApiError(401, 'Invalid Refresh Token.');
      }

      const user: ReqUser = {
        id: verifyToken.id,
        name: verifyToken.name,
        role: verifyToken.role,
        email: verifyToken.email,
      };

      const { accessToken, refreshToken } = await generateToken(user);

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

      req.user = user;
      return next();
    }

    const verifyToken = verifyAccessToken(access);
    if (!verifyToken) {
      throw new ApiError(401, 'Invalid Access Token.');
    }

    req.user = {
      id: verifyToken.id,
      name: verifyToken.name,
      role: verifyToken.role,
      email: verifyToken.email,
    };

    return next();
  } catch (error) {
    res.clearCookie('saher_access_token');
    res.clearCookie('saher_refresh_token');

    return next(error instanceof ApiError ? error : new ApiError(401, 'Invalid Tokens'));
  }
};
