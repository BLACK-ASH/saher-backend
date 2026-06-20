import type { Request, Response } from 'express';

import { AuditLog } from '../../database/audit-log.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { createLogResponsiveSchema } from '../audit-log/audit-log.schema.js';

export const getAuditLogController = async (req: Request, res: Response) => {
  const user = req.user?.id;
  if (!user) throw new ApiError(400, 'Fobidden: user required');

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const count = await AuditLog.countDocuments();

  const key = createKey('reimbursement', 'audit-log', 'list', user.toString());
  const data = await getCache(key);

  if (data) {
    return ApiResponse.success(res, {
      message: 'Bills Audit Log',
      data: data,
      statusCode: 200,
      meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
    });
  }

  const getAllAuditLog = await AuditLog.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const normalized = normalizeDoc(getAllAuditLog);
  const parsed = createLogResponsiveSchema.array().parse(normalized);

  await setCache(key, parsed, 7200);

  return ApiResponse.success(res, {
    message: 'Bills Audit Log',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
  });
};
