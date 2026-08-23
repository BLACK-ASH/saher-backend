import type { Request, Response } from 'express';

import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { client } from '../../libs/redis/redis-client.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';
import { formatMessage } from '../../libs/utils/formatted-message.js';
import { notification } from '../../libs/utils/notification.js';
import { getSessionMeta } from '../_utils/session-meta.js';

export const logoutController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(400, 'user must be login');

  const sessionId = req.cookies?.saher_session_id as string | undefined;

  // Revoke server-side session — cookie clearing alone leaves refresh valid ≤60d
  if (sessionId) {
    await deleteCache(createKey('session', sessionId));
    await client.sRem(createKey('user_session', user.id), sessionId);
  }

  const meta = await getSessionMeta(req);

  const desc = `user logout from ${meta.device} using ${meta.browser}`;
  await notification.specific.info([user.id], 'User Logout', formatMessage(desc));

  res.clearCookie('saher_access_token');
  res.clearCookie('saher_refresh_token');
  res.clearCookie('saher_session_id');

  return ApiResponse.success(res, {
    message: 'Logout successfully.',
    data: null,
    statusCode: 200,
  });
};
