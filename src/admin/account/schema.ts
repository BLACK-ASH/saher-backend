import z from 'zod';

import { hashPassword } from '../../libs/utils/password-hash.js';
import { objectId } from '../../libs/utils/zod-object-id.js';
import { bankSchema } from '../bank/schema.js';

export const userSchema = z.object({
  name: z
    .string('Username Is Required.')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Only alphanumeric, underscore and hyphen allowed',
    })
    .refine((val) => !/^[0-9_-]/.test(val), {
      message: 'Cannot start with _ and - or Number',
    })
    .refine((val) => !/[_-]$/.test(val), {
      message: 'Cannot end with _ or -',
    })
    .min(2),
  displayName: z.string().optional(),
  image: objectId('User Profile Image Is Required.'),
  role: z.enum(['user', 'manager', 'admin']).default('user'),
  email: z.email('Email Address Is Required.'),
  password: z.string().optional(),
});

export const accountBaseSchema = z.object({
  gender: z.enum(['male', 'female', 'other']).default('other'),
  dateOfBirth: z.coerce.date('Date Of Birth Is Required.'),
  dateOfJoining: z.coerce.date('Date Of Joining Is Required.'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
      message: 'Invalid Indian Mobile Number',
    })
    .transform((val) => val.replace(/^\+91[\s-]?|^91[\s-]?/, '')),
  secondaryPhoneNumber: z
    .string()
    .trim()
    .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
      message: 'Invalid Indian Mobile Number',
    })
    .transform((val) => val.replace(/^\+91[\s-]?|^91[\s-]?/, ''))
    .optional(),
  employeeId: z.string('Employee Id Is Required.'),
  department: z.string('Department Is Required.'),
  designation: z.string('Designation Is Required.'),
  employeeType: z.enum(['full-time', 'part-time', 'volunteer'], 'Employee Type Is Required.'),
  employeeShift: z.enum(['shift-1', 'shift-2']).optional(),
  salaryStructure: z.string('Salary Structure Is Required.'),
  address: z.string('Address Is Required.'),
  aadhar: objectId('Aadhar Card Is Required.'),
  pan: objectId('Pan Card Is Required.'),
  resume: objectId('Resume Is Required.'),
});

const accountSchema = accountBaseSchema.refine(
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
    bank: bankSchema,
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
      bank: data.bank,
    };
  });

export const accountUpdateSchema = z.object(accountSchema.shape).partial();

export type AccountRegisterInput = z.infer<typeof accountRegisterSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
