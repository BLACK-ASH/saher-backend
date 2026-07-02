import type { Request, Response } from 'express';

import { auditLog } from './audit-log.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const createAuditLogController = async (req: Request, res: Response) => {
  const { date, description, amount, from, to, status } = req.body;

  await auditLog(date, description, amount, from, to, status);

  return ApiResponse.success(res, {
    message: 'audit log created successfully',
    data: null,
    statusCode: 200,
  });
};
