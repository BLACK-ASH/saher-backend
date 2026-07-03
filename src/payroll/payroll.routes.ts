import { Router } from "express";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { payrollController } from "./update-payroll.controller.js";
import { createPayrollSchema } from "./schema.js";
import { payrollLeaveMangement } from "./payroll-management.cron.js";
import { getAllPayrollController, getPayrollByPayrollIdController, getPayrollByUserIdController, } from "./get-payroll.controller.js";

const payrollRouter = Router();

payrollRouter.post('/cron', authorize('write', 'payroll'), payrollLeaveMangement);
payrollRouter.put('/:id', authorize('update', 'payroll'), validate(createPayrollSchema), payrollController);
payrollRouter.get('/', authorize('read', 'payroll'), getAllPayrollController);
payrollRouter.get('/user/:id', authorize('read', 'payroll'), getPayrollByUserIdController);
payrollRouter.get('/:id', authorize('read', 'payroll'), getPayrollByPayrollIdController);


export default payrollRouter