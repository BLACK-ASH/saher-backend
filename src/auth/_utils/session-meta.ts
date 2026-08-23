import type { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export type SessionMeta = {
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
};

// ponytail: dropped ipapi.co geo lookup — leaked user IPs to a third party and blocked
// login/logout up to 800ms; re-add only with a self-hosted geo source if product needs it.
export const getSessionMeta = async (req: Request): Promise<SessionMeta> => {
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const device = result.device.type || 'desktop';
  const browser = result.browser.name || 'unknown';
  const os = result.os.name || 'unknown';

  return {
    ip,
    userAgent,
    device,
    browser,
    os,
  };
};
