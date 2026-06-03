import { NextFunction, Request, Response } from 'express';
import { renewToken, SessionT, verifyAccessToken } from '../../auth/_utils/token.js';
import { ApiError } from '../class/api-error.js';
import { createKey, getCache } from '../redis/redis-utils.js';
import jwt from 'jsonwebtoken';

// export const protectedRoute = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const access = req.cookies?.saher_access_token;
//     const refresh = req.cookies?.saher_refresh_token;
//     const sessionId = req.cookies?.saher_session_id;
//     const isProd = process.env.NODE_ENV === 'production';
//
//     if (!sessionId) {
//       throw new ApiError(401, 'Invalid Session');
//     }
//
//     if (!access) {
//       if (!refresh || !sessionId) {
//         throw new ApiError(401, 'Login Required.');
//       }
//
//       const newToken = await renewToken(sessionId, refresh);
//
//       if (!newToken) throw new ApiError(401, 'Invalid Session : Renew token failed');
//
//       const { accessToken, refreshToken, user } = newToken;
//
//       res.cookie('saher_access_token', accessToken, {
//         maxAge: 15 * 60 * 1000,
//         httpOnly: true,
//         secure: isProd,
//         sameSite: isProd ? 'none' : 'lax',
//       });
//
//       res.cookie('saher_refresh_token', refreshToken, {
//         maxAge: 60 * 24 * 60 * 60 * 1000,
//         httpOnly: true,
//         secure: isProd,
//         sameSite: isProd ? 'none' : 'lax',
//       });
//
//       res.cookie('saher_session_id', sessionId, {
//         maxAge: 60 * 24 * 60 * 60 * 1000,
//         httpOnly: true,
//         secure: isProd,
//         sameSite: isProd ? 'none' : 'lax',
//       });
//
//       req.user = user;
//       return next();
//     }
//
//     const verifyToken = verifyAccessToken(access);
//     if (!verifyToken) {
//       throw new ApiError(401, 'Invalid Access Token.');
//     }
//
//     const session = await getCache(createKey('session', sessionId));
//
//     if (!session) {
//       throw new ApiError(401, 'Session expired');
//     }
//
//     req.user = {
//       id: verifyToken.id,
//       name: verifyToken.name,
//       role: verifyToken.role,
//       email: verifyToken.email,
//     };
//
//     return next();
//   } catch (error) {
//     if (
//       error instanceof ApiError &&
//       (error.message === 'Session expired' || error.message === 'Invalid Session')
//     ) {
//       res.clearCookie('saher_access_token');
//       res.clearCookie('saher_refresh_token');
//       res.clearCookie('saher_session_id');
//     }
//
//     return next(error instanceof ApiError ? error : new ApiError(401, 'Invalid Tokens'));
//   }
// };

export const protectedRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const access = req.cookies?.saher_access_token;

    const refresh = req.cookies?.saher_refresh_token;

    const sessionId = req.cookies?.saher_session_id;

    const isProd = process.env.NODE_ENV === 'production';

    if (!sessionId) {
      throw new ApiError(401, 'Invalid Session');
    }

    // =========================
    // ACCESS TOKEN
    // =========================

    if (access) {
      try {
        const verifyToken = verifyAccessToken(access);

        const session = await getCache<SessionT>(createKey('session', sessionId));

        if (!session) {
          throw new ApiError(401, 'Session expired');
        }

        req.user = {
          id: verifyToken.id,
          name: verifyToken.name,
          role: verifyToken.role,
          email: verifyToken.email,
        };

        return next();
      } catch (error) {
        if (!(error instanceof jwt.TokenExpiredError)) {
          throw error;
        }
      }
    }

    // =========================
    // REFRESH FLOW
    // =========================

    if (!refresh) {
      throw new ApiError(401, 'Login Required');
    }

    let newToken;

    try {
      newToken = await renewToken(sessionId, refresh);
    } catch (error) {
      throw error;
    }

    // another request is already refreshing
    if (newToken && newToken.type === 'LOCKED') {
      await new Promise((resolve) => setTimeout(resolve, 300));

      newToken = await renewToken(sessionId, refresh);
    }

    if (!newToken || newToken.type === 'LOCKED') {
      throw new ApiError(401, 'Refresh Failed');
    }

    const { accessToken, refreshToken, user } = newToken;

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

    req.user = user;

    return next();
  } catch (error) {
    if (
      error instanceof ApiError &&
      ['Invalid Session', 'Session expired', 'Invalid Refresh Token'].includes(error.message)
    ) {
      res.clearCookie('saher_access_token');
      res.clearCookie('saher_refresh_token');
      res.clearCookie('saher_session_id');
    }

    return next(error instanceof ApiError ? error : new ApiError(401, 'Invalid Tokens'));
  }
};
