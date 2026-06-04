import { ObjectId } from 'mongoose';

import { createLogResponsiveSchema } from './audit-log.schema.js';
import { AuditLog } from '../../database/audit-log.model.js';
import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

export const auditLogController = async (settlementId: string) => {
  const existBill = await Settlement.findById(settlementId);
  if (!existBill) throw new ApiError(400, 'Bill not found');

  const billId = await Bill.findById(existBill.bill);
  if (!billId || billId?.isDeleted === true) throw new ApiError(400, 'Bill not found');

  const createLog = await AuditLog.create({
    bill: settlementId,
    date: existBill.date,
    description: billId?.description,
    amount: existBill.amount,
    from: 'saher',
    to: 'user',
    status: existBill.status,
  });

  return createLog;
};
