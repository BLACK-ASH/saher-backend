import { Router } from "express";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { getPayrollController, payrollController } from "./controller.js";
import { createPayrollSchema } from "./schema.js";
import { payrollLeaveMangement } from "./leave-management.cron.js";

const payrollRouter = Router();

payrollRouter.post('/create/:id', authorize('write', 'payroll'), validate(createPayrollSchema), payrollController);
payrollRouter.get('/get-payrolls', authorize('write', 'payroll'), getPayrollController);

payrollRouter.post('/leave-manage/:id',payrollLeaveMangement);

export default payrollRouter