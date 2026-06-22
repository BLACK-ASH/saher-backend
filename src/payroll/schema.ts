import z from "zod";
import { objectId } from "../libs/utils/zod-object-id.js";
import { salaryMode, salaryStatus } from "../database/payroll.model.js";

export const createPayrollSchema = z.object({
    date: z.coerce.date(),
    mode: z.enum(salaryMode),
    paidSalary: z.number(),
    bonus: z.number(),
    deduction: z.number(),
});

export const payrollResponseSchema = z.array(z.object({
    user: objectId(),
    date: z.coerce.date(),
    mode: z.enum(salaryMode),
    expectedSalary: z.number(),
    paidSalary: z.number(),
    remainingSalary: z.number(),
    bonus: z.number(),
    deduction: z.number(),
    status: z.enum(salaryStatus),
}))

export type CreatePayrollInputType = z.infer<typeof createPayrollSchema>;