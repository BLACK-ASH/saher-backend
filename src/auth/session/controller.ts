import type { Request, Response } from 'express';

import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { client } from '../../libs/redis/redis-client.js';
import { createKey, deleteCache, getCache } from '../../libs/redis/redis-utils.js';
import type { SessionT } from '../_utils/token.js';

export const getAllSessionController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden');

  const sessionIds = await client.sMembers(createKey('user_session', user.id));

  type SessionSummary = {
    sessionId: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
    createdAt: number;
    updatedAt: number;
  };

  const sessions = (
    await Promise.all(
      sessionIds.map(async (sessionId): Promise<SessionSummary | null> => {
        const session = await getCache<SessionT>(createKey('session', sessionId));

        // 🔥 cleanup stale session
        if (!session) {
          await client.sRem(createKey('user_session', user.id), sessionId);
          return null;
        }

        return {
          sessionId,
          ip: session.meta.ip,
          device: session.meta.device,
          browser: session.meta.browser,
          os: session.meta.os,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        };
      }),
    )
  ).filter((s): s is SessionSummary => s !== null);

  return ApiResponse.success(res, {
    message: 'user all sessions',
    data: sessions,
    statusCode: 200,
  });
};

export const revokeSessionController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden');

  const sessionId = req.params.id as string;
  if (!sessionId) throw new ApiError(400, 'no session id provided');

  const key = createKey('session', sessionId);
  await deleteCache(key);
  await client.sRem(createKey('user_session', user.id), sessionId);

  return ApiResponse.success(res, {
    message: 'session revoke successful',
    data: null,
    statusCode: 200,
  });
};

export const logoutAllSessionsController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(403, 'Forbidden');

  const userSessionKey = createKey('user_session', user.id);

  // 1️⃣ get all session ids
  const sessionIds = await client.sMembers(userSessionKey);

  if (sessionIds.length === 0) {
    return ApiResponse.success(res, {
      message: 'No active sessions',
      data: null,
      statusCode: 200,
    });
  }

  // 2️⃣ create pipeline (fast + atomic-ish)
  const pipeline = client.multi();

  for (const sessionId of sessionIds) {
    pipeline.del(createKey('session', sessionId));
  }

  // 3️⃣ remove the set itself
  pipeline.del(userSessionKey);

  await pipeline.exec();

  // 4️⃣ clear current cookies
  res.clearCookie('saher_access_token');
  res.clearCookie('saher_refresh_token');
  res.clearCookie('saher_session_id');

  return ApiResponse.success(res, {
    message: 'Logged out from all devices',
    data: null,
    statusCode: 200,
  });
};
