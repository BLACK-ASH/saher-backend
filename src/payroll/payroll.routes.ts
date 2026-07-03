import { Router } from "express";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { payrollController } from "./update-payroll.controller.js";
import { createPayrollSchema } from "./schema.js";
import { payrollLeaveMangement } from "./payroll-management.cron.js";
import { getAllPayrollController, getPayrollByUserIdController, } from "./get-payroll.controller.js";

const payrollRouter = Router();

payrollRouter.post('/cron', authorize('write', 'payroll'), payrollLeaveMangement);
payrollRouter.put('/update/:id', authorize('update', 'payroll'), validate(createPayrollSchema), payrollController);
payrollRouter.get('/get-all', authorize('read', 'payroll'), getAllPayrollController);
payrollRouter.get('/get/:id', authorize('read', 'payroll'), getPayrollByUserIdController);


export default payrollRouter