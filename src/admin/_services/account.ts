import z from 'zod';

import { bankSchemaFinal } from './bank.js';
import { userSchemaFinal } from './user.js';
import { Account } from '../../database/account.model.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { imageType } from '../../libs/utils/zod-object-id.js';
import { accountBaseSchema } from '../account/schema.js';

const accountSchemaFinal = accountBaseSchema
  .omit({ aadhar: true, pan: true, resume: true })
  .safeExtend({
    id: z.string(),
    user: userSchemaFinal,
    bank: bankSchemaFinal,
    aadhar: imageType,
    pan: imageType,
    resume: imageType,
  })
  .readonly();

export type AccountT = z.infer<typeof accountSchemaFinal>;

export const getAccount = async (id: string): Promise<AccountT | null> => {
  const key = createKey('account', id);

  const cacheAccount = await getCache<AccountT>(key);
  if (cacheAccount) return cacheAccount;

  const account = await Account.findById(id)
    .populate('bank aadhar pan resume')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .lean();

  if (!account) return null;

  const normalize = normalizeDoc(account);
  const parsed = accountSchemaFinal.parse(normalize);

  await setCache(key, parsed, 604800);

  return parsed;
};

export const getAccountByUser = async (id: string): Promise<AccountT | null> => {
  const key = createKey('account', 'userId', id);

  const cacheAccount = await getCache<AccountT>(key);
  if (cacheAccount) return cacheAccount;

  const account = await Account.findOne({ user: id })
    .populate('bank aadhar pan resume')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .lean();

  if (!account) return null;

  const normalize = normalizeDoc(account);
  const parsed = accountSchemaFinal.parse(normalize);

  await setCache(key, parsed, 604800);

  return parsed;
};
