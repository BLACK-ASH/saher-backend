import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import type { SessionMeta } from './session-meta.js';
import type { UserRole } from '../../database/user.model.js';
import { client } from '../../libs/redis/redis-client.js';
import { createKey, deleteCache, getCache, setCache } from '../../libs/redis/redis-utils.js';

// Request User Type
export type ReqUser = {
  id: string;
  name: string;
  role: UserRole;
  email: string;
};

export type SessionT = {
  user: ReqUser;
  refreshTokenHash: string;
  createdAt: number;
  updatedAt: number;
  meta: SessionMeta;

  previousRefreshTokenHash?: string;
  previousRefreshTokenExpiresAt?: number;
};

// Reusable Hash Function
const hash = (val: string) => crypto.createHash('sha256').update(val).digest('hex');

// Generate Refresh Token
const generateRefreshToken = () => crypto.randomBytes(128).toString('hex');

// Generate All Token
export const generateToken = async (data: ReqUser, meta: SessionMeta) => {
  // Generate Session Id
  const sessionId = crypto.randomBytes(64).toString('hex');

  const refreshToken = generateRefreshToken();

  await setCache(
    createKey('session', sessionId),
    {
      user: data,
      refreshTokenHash: hash(refreshToken),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta,
    },
    60 * 60 * 24 * 60, // 60 days
  );

  // Store User Sessions
  await client.sAdd(createKey('user_session', data.id), sessionId);

  // Generate Access Token
  const accessToken = jwt.sign(data, process.env.JWT_ACCESS_SECRET!, {
    algorithm: 'HS384',
    expiresIn: '15m',
  });

  return { accessToken, refreshToken, sessionId };
};

// Refresh All Token
// export const renewToken = async (sessionId: string, refreshToken: string) => {
//   const newRefreshToken = generateRefreshToken();
//
//   const session = await getCache<SessionT>(createKey('session', sessionId));
//
//   if (!session) return null;
//
//   await setCache(
//     createKey('session', sessionId),
//     {
//       ...session,
//       refreshTokenHash: hash(newRefreshToken),
//       updatedAt: Date.now(),
//     },
//     60 * 60 * 24 * 60, // 60 days
//   );
//
//   const isValid = session.refreshTokenHash === hash(refreshToken);
//
//   if (!isValid) {
//     await client.del(createKey('session', sessionId));
//     return null;
//   }
//   // Generate Access Token
//   const accessToken = jwt.sign(session?.user, process.env.JWT_ACCESS_SECRET!, {
//     algorithm: 'HS384',
//     expiresIn: '15m',
//   });
//
//   return { accessToken, refreshToken: newRefreshToken, user: session.user };
// };

export const renewToken = async (sessionId: string, refreshToken: string) => {
  const sessionKey = createKey('session', sessionId);

  const session = await getCache<SessionT>(sessionKey);

  if (!session) return null;

  const incomingHash = hash(refreshToken);

  const isValid =
    incomingHash === session.refreshTokenHash ||
    (incomingHash === session.previousRefreshTokenHash &&
      Date.now() < (session.previousRefreshTokenExpiresAt ?? 0));

  if (!isValid) {
    await deleteCache(sessionKey);
    await client.sRem(createKey('user_session', session.user.id), sessionId);

    return null;
  }

  const newRefreshToken = generateRefreshToken();

  const updatedSession: SessionT = {
    ...session,

    previousRefreshTokenHash: session.refreshTokenHash,
    previousRefreshTokenExpiresAt: Date.now() + 15000,

    refreshTokenHash: hash(newRefreshToken),

    updatedAt: Date.now(),
  };

  await setCache(sessionKey, updatedSession, 60 * 60 * 24 * 60);

  const accessToken = jwt.sign(session.user, process.env.JWT_ACCESS_SECRET!, {
    algorithm: 'HS384',
    expiresIn: '15m',
  });

  return {
    type: 'SUCCESS',
    accessToken,
    refreshToken: newRefreshToken,
    user: session.user,
  } as const;
};

// To Verify Access Token
export const verifyAccessToken = (accessToken: string) => {
  const data = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!, {
    algorithms: ['HS384'],
  });

  return data as ReqUser;
};

// To Verify Refresh Token
export const verifyRefreshToken = async (sessionId: string, refreshToken: string) => {
  const session = await getCache<SessionT>(createKey('session', sessionId));

  if (!session) return null;

  const isValid = session.refreshTokenHash === hash(refreshToken);

  if (!isValid) {
    await deleteCache(createKey('session', sessionId));
    return null;
  }

  return session;
};
