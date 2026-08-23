import z from 'zod';

// Schemas
// Register Schema
export const bankSchema = z.object({
  accountHolderName: z.string('Account Holder Name Is Required'),
  bankName: z.string('Bank Name Is Required.'),
  accountNumber: z.string('Bank Account Number Is Required.'),
  ifcs: z
    .string('Bank IFCS Code Is Required.')
    .trim()
    .regex(/^[a-zA-Z]{4}0[a-zA-Z0-9]{6}$/, {
      message: 'Invalid IFCS Code According To Indian Banks.',
    })
    .transform((val) => val.toUpperCase()),
  branch: z.string('Branch Name Is Required.'),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
      message: 'Invalid Indian mobile number',
    })
    .transform((val) => val.replace(/^\+91[\s-]?|^91[\s-]?/, '')),
});

// Update Schema
export const bankUpdateSchema = bankSchema.partial().strict();

// Types
export type BankRegisterType = z.infer<typeof bankSchema>;
export type BankUpdateType = z.infer<typeof bankUpdateSchema>;
