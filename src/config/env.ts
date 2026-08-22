import 'dotenv/config';
import { z } from 'zod';

// Fail-fast boot validation. Parsed exactly once, before any consumer reads process.env.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGO_URI: z.url(),
  REDIS_URL: z.url(),
  // Public origin used to build mail links / PDF asset URLs (e.g. https://saherindia.org)
  BASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(16),

  RESEND_API_KEY: z.string().min(20),
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),

  // Optional today: only src/libs/utils/calendar.ts consumes it and tolerates absence
  GOOGLE_API_KEY: z.string().optional(),

  // Bootstrap credentials for `pnpm seed` only — required by seeds/create-first-user,
  // not by api/worker boot. Password must be strong; it unlocks the first admin account.
  SEED_ADMIN_EMAIL: z.email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(12).optional(),
});

export const env = envSchema.parse(process.env);
