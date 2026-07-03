import z from "zod";
import { objectId } from "../libs/utils/zod-object-id.js";
import { salaryMode, salaryStatus } from "../database/payroll.model.js";

export const createPayrollSchema = z.object({
    mode: z.enum(salaryMode),
    paidSalary: z.number(),
});

export const payrollResponseSchema = z.array(z.object({
    id: z.string(),
    user: objectId(),
    dateOfCreation: z.coerce.date(),
    dateOfPayment: z.coerce.date().optional(),
    mode: z.enum(salaryMode),
    baseSalary: z.number(),
    expectedSalary: z.number(),
    paidSalary: z.number().optional(),
    remainingSalary: z.number(),
    bonus: z.number(),
    deduction: z.string(),
    status: z.enum(salaryStatus),
}))

export type CreatePayrollInputType = z.infer<typeof createPayrollSchema>;