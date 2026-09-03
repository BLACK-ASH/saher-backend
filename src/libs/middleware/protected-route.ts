import { NextFunction, Request, Response } from 'express';
import { SessionT, verifyAccessToken } from '../../auth/_utils/token.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../class/api-error.js';
import { createKey, getCache } from '../redis/redis-utils.js';

//
export const protectedRoute = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const access = req.cookies?.saher_access_token;
    const sessionId = req.cookies?.saher_session_id;

    if (!sessionId) {
      throw new ApiError(401, 'Invalid Session');
    }

    const session = await getCache<SessionT>(createKey('session', sessionId));

    if (!session) {
      throw new ApiError(401, 'Session expired');
    }

    if (!access) {
      throw new ApiError(401, 'Access token missing');
    }

    const user = verifyAccessToken(access);

    // Bind session to JWT subject — a stolen access token paired with an attacker's
    // own session id must not authenticate as the victim.
    if (!user || user.id !== session.user.id) {
      throw new ApiError(401, 'Invalid Session');
    }

    // Check if user is still active — revoked/deactivated users must not access protected routes
    const dbUser = await User.findById(user.id).select('isActive').lean();
    if (!dbUser || !dbUser.isActive) {
      throw new ApiError(401, 'Account has been deactivated');
    }

    req.user = user;

    return next();
  } catch (error) {
    // DO NOT refresh here
    return next(error instanceof ApiError ? error : new ApiError(401, 'Unauthorized'));
  }
};
