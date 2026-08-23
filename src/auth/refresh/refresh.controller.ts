import type { Request, Response, CookieOptions } from 'express';

import { corsOrigins } from '../../config/env.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { renewToken } from '../_utils/token.js';

const isProd = process.env.NODE_ENV === 'production';

// sameSite:'none' (cross-site cookies) only when an explicit CORS allowlist exists;
// otherwise 'lax' — kills the CSRF chain from reflect-all-origin + none.
const crossSiteFrontend = corsOrigins.length > 0;

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd && crossSiteFrontend ? 'none' : 'lax',
  path: '/',
};

export const refreshController = async (req: Request, res: Response) => {
  const sessionId = req.cookies?.saher_session_id;
  const refresh = req.cookies?.saher_refresh_token;

  if (!sessionId || !refresh) {
    throw new ApiError(401, 'Login Required');
  }

  const result = await renewToken(sessionId, refresh);

  if (!result || result.type !== 'SUCCESS') {
    res.clearCookie('saher_access_token');
    res.clearCookie('saher_refresh_token');
    res.clearCookie('saher_session_id');

    throw new ApiError(401, 'Refresh Failed');
  }

  res.cookie('saher_access_token', result.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('saher_refresh_token', result.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 24 * 60 * 60 * 1000,
  });

  res.cookie('saher_session_id', sessionId, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, {
    data: result.user,
  });
};
