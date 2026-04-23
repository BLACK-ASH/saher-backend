import z from 'zod';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { userSchema } from '../account/schema.js';
import { User } from '../../database/user.model.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { imageType } from '../../libs/utils/zod-object-id.js';

export const userSchemaFinal = userSchema
  .extend({
    id: z.string(),
    image: imageType,
    displayName: z.string(),
    emailVerified: z.boolean(),
    isActive: z.boolean(),
    isBanned: z.boolean(),
    deletedAt: z.date().optional(),
    deleteBy: userSchema.omit({ password: true }).optional(),
    bannedAt: z.date().optional(),
    bannedBy: userSchema.omit({ password: true }).optional(),
  })
  .omit({ password: true })
  .readonly();

export type UserT = z.infer<typeof userSchemaFinal>;

export const getUser = async (id: string) => {
  const key = createKey('user', id);
  const cacheUser = await getCache<UserT>(key);
  if (cacheUser) return cacheUser;

  const user = await User.findById(id).populate('image deleteBy bannedBy').lean();
  if (!user) return null;

  const normalize = normalizeDoc(user);
  const parsed = userSchemaFinal.parse(normalize);

  await setCache(key, parsed, 604800);

  return parsed;
};
