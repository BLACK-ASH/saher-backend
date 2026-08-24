import z from 'zod';

import { Bank } from '../../database/bank.model.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { bankSchema } from '../bank/schema.js';

export const bankSchemaFinal = bankSchema.extend({ id: z.string() }).readonly();
export type BankT = z.infer<typeof bankSchemaFinal>;

export const getBank = async (id: string): Promise<BankT | null> => {
  const key = createKey('bank', id);

  const cacheBank = await getCache<BankT>(key);
  if (cacheBank) return cacheBank;

  const bank = await Bank.findOne({ _id: id, isDeleted: false }).lean();
  if (!bank) return null;

  const normalize = normalizeDoc(bank);
  const parsed = bankSchemaFinal.parse(normalize);

  await setCache(key, parsed, 604800);

  return parsed;
};
