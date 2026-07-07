import { AuditLog } from '../../database/audit-log.model.js';

export const auditLog = async (
  date: Date,
  description: string,
  amount: number,
  from: string,
  to: string,
) => {
  const createLog = await AuditLog.create({
    date,
    description,
    amount,
    from,
    to,
  });

  return createLog;
};
