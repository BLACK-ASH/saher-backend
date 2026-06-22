import { Router } from "express";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { getPayrollController, payrollController } from "./controller.js";
import { createPayrollSchema } from "./schema.js";

const payrollRouter = Router();

payrollRouter.post('/create/:id', authorize('write', 'payroll'), validate(createPayrollSchema), payrollController);
payrollRouter.get('/get-payrolls', authorize('write', 'payroll'), getPayrollController);

export default payrollRouter