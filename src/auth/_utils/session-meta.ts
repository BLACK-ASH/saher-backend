import type { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export type SessionMeta = {
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  location?: {
    country?: string;
    city?: string;
  };
};

export const getSessionMeta = async (req: Request): Promise<SessionMeta> => {
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const device = result.device.type || 'desktop';
  const browser = result.browser.name || 'unknown';
  const os = result.os.name || 'unknown';

  let location: SessionMeta['location'] = undefined;

  // 🌍 Non-blocking location fetch
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(800), // 🔥 timeout (important)
    });

    if (res.ok) {
      const data = await res.json();

      location = {
        country: data.country_name,
        city: data.city,
      };
    }
  } catch {
    // ❌ silently ignore failures
  }

  return {
    ip,
    userAgent,
    device,
    browser,
    os,
    location,
  };
};
