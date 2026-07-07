import type { Request, Response } from 'express';

import { ApiResponse } from '../../libs/class/api-response.js';
import { auditLog } from '../../libs/utils/audit-log.js';

export const createAuditLogController = async (req: Request, res: Response) => {
  const { date, description, amount, from, to } = req.body;

  await auditLog(date, description, amount, from, to);

  return ApiResponse.success(res, {
    message: 'audit log created successfully',
    data: null,
    statusCode: 200,
  });
};
