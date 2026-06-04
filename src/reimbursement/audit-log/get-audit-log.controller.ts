import type { Request, Response } from 'express';

import { createLogResponsiveSchema } from './audit-log.schema.js';
import { AuditLog } from '../../database/audit-log.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

export const getAuditLogController = async (req: Request, res: Response) => {
  const getAllAuditLog = await AuditLog.find().lean();
  const normalized = normalizeDoc(getAllAuditLog);
  const parsed = createLogResponsiveSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bills Audit Log',
    data: parsed,
    statusCode: 201,
  });
};
