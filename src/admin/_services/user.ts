import z from 'zod';

import { User } from '../../database/user.model.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { imageType } from '../../libs/utils/zod-object-id.js';
import { userSchema } from '../account/schema.js';

export const userSchemaFinal = userSchema
  .extend({
    id: z.string(),
    // users created outside the account flow (seeded/self-registered) have neither
    // a derived displayName nor a populated image doc — tolerate both or /me 500s
    image: imageType.nullish(),
    displayName: z.string().optional(),
    // list endpoints populate users with name/email/role only; fall back to model defaults
    emailVerified: z.boolean().default(false),
    pushNotificationsEnabled: z.boolean().default(false),
    isActive: z.boolean().default(true),
    isBanned: z.boolean().default(false),
    deletedAt: z.coerce.date().optional(),
    deleteBy: userSchema.omit({ password: true }).optional(),
    bannedAt: z.coerce.date().optional(),
    bannedBy: userSchema.omit({ password: true }).optional(),
  })
  .omit({ password: true })
  .readonly();

export const shortUserSchema = userSchema
  .pick({ name: true, email: true, role: true })
  .extend({ id: z.string() });

export type UserT = z.infer<typeof userSchemaFinal>;

export const getUser = async (id: string) => {
  const key = createKey('user', id);
  const cacheUser = await getCache<UserT>(key);
  if (cacheUser) return cacheUser;

  const user = await User.findById(id).populate('image deletedBy bannedBy').lean();
  if (!user) return null;

  const normalize = normalizeDoc(user);
  const parsed = userSchemaFinal.parse(normalize);

  await setCache(key, parsed, 604800);

  return parsed;
};
