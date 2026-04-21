import z from 'zod';
import { Account } from '../../database/account.model.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { accountSchema } from '../account/schema.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { userSchemaFinal } from './user.js';
import { bankSchemaFinal } from './bank.js';

const accountSchemaFinal = accountSchema
  .safeExtend({
    id: z.string(),
    user: userSchemaFinal,
    bank: bankSchemaFinal,
  })
  .readonly();

type AccountT = z.infer<typeof accountSchemaFinal>;

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

  await setCache(key, parsed);

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

  await setCache(key, parsed);

  return parsed;
};
