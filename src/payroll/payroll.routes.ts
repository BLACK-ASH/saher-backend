import { Router } from 'express';

import { approvePayrollController } from './approve-payroll.controller.js';
import {
  getAllPayrollController,
  getPayrollByPayrollIdController,
  getPayrollByUserIdController,
} from './get-payroll.controller.js';
import { payrollLeaveMangement } from './payroll-management.cron.js';
import { createPayrollSchema } from './schema.js';
import { payrollController } from './update-payroll.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

const payrollRouter = Router();

payrollRouter.post('/cron', authorize('write', 'payroll'), payrollLeaveMangement);
payrollRouter.post('/approve/:id', authorize('update', 'payroll'), approvePayrollController);
payrollRouter.put(
  '/:id',
  authorize('update', 'payroll'),
  validate(createPayrollSchema),
  payrollController,
);
payrollRouter.get('/', authorize('read', 'payroll'), getAllPayrollController);
payrollRouter.get('/user/:id', authorize('read', 'payroll'), getPayrollByUserIdController);
payrollRouter.get('/:id', authorize('read', 'payroll'), getPayrollByPayrollIdController);

export default payrollRouter;
