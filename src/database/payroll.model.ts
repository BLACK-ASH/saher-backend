import mongoose from "mongoose";

export const salaryStatus = ['paid', 'unpaid', 'partially-paid']
export const salaryMode = ['cash', 'cheque', 'upi', '-']

export const payrollSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        dateOfPayment: {
            type: Date,
        },
        dateOfCreation: {
            type: Date,
        },
        mode: {
            type: String,
            enum: salaryMode,
            default: '-',
        },
        workingDays:{
            type: Number,
            required: true,
        },
        baseSalary: {
            type: Number,
            required: true,
        },
        expectedSalary: {
            type: Number,
            default: 0,
            min: 0,
        },
        paidSalary: {
            type: Number,
            min: 0,
        },
        remainingSalary: {
            type: Number,
            default: 0,
            min: 0,
        },
        bonus: {
            type: Number,
            default: 0,
            min: 0,
        },
        deduction: {
            type: String,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: salaryStatus,
            default: 'unpaid'
        },
    }, { timestamps: true },
);
export type PayrollType = mongoose.InferSchemaType<typeof payrollSchema>
export const Payroll = mongoose.model<PayrollType>('Payroll', payrollSchema);