import z from 'zod';
import { hashPassword } from '../../libs/utils/password-hash.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

export const userSchema = z.object({
  name: z.string('Username Is Required.').trim().min(2),
  displayName: z.string().optional(),
  image: objectId('User Profile Image Is Required.'),
  role: z.enum(['user', 'manager', 'admin']).default('user'),
  email: z.email('Email Address Is Required.'),
  password: z.string().optional(),
});

const accountSchema = z
  .object({
    gender: z.enum(['male', 'female', 'other']).default('other'),
    dateOfBirth: z.coerce.date('Date Of Birth Is Required.'),
    dateOfJoining: z.coerce.date('Date Of Joining Is Required.'),
    phoneNumber: z.string().trim().min(1, 'Phone Number Is Required.'),
    secondaryPhoneNumber: z.string().trim().optional(),
    employeeId: z.string('Employee Id Is Required.'),
    department: z.string('Department Is Required.'),
    designation: z.string('Designation Is Required.'),
    employeeType: z.enum(['full-time', 'part-time', 'volunteer'], 'Employee Type Is Required.'),
    employeeShift: z.enum(['shift-1', 'shift-2']).optional(),
    salaryStructure: z.string('Salary Structure Is Required.'),
    address: z.string('Address Is Required.'),
    bankDetail: objectId('Bank Details Are Required.'),
    aadhar: objectId('Aadhar Card Is Required.'),
    pan: objectId('Pan Card Is Required.'),
    resume: objectId('Resume Is Required.'),
  })
  .refine(
    (data) => {
      if (data.employeeType === 'part-time') {
        return !!data.employeeShift;
      }
      return true;
    },
    {
      message: 'Employee Shift Is Required For Part Time Employee.',
      path: ['employeeShift'],
    },
  );

export const accountRegisterSchema = z
  .object({
    user: userSchema,
    account: accountSchema,
  })
  .transform(async (data) => {
    const displayName = data.user.displayName || data.user.name;

    const password =
      data.user.name.slice(0, 4).toUpperCase() + new Date(data.account.dateOfBirth).getFullYear();

    const hashedPassword = await hashPassword(password);

    const secondaryPhoneNumber = data.account.secondaryPhoneNumber || data.account.phoneNumber;

    return {
      user: {
        ...data.user,
        displayName,
        password: hashedPassword,
      },
      account: {
        ...data.account,
        secondaryPhoneNumber,
      },
    };
  });

export const accountUpdateSchema = accountSchema.partial();

export type AccountRegisterInput = z.infer<typeof accountRegisterSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
