import type { Request, Response } from 'express';

import { createLogResponsiveSchema } from './audit-log.schema.js';
import { AuditLog } from '../../database/audit-log.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

export const getAuditLogController = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const getAllAuditLog = await AuditLog.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const count = await AuditLog.countDocuments();

  const normalized = normalizeDoc(getAllAuditLog);
  const parsed = createLogResponsiveSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bills Audit Log',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
  });
};
