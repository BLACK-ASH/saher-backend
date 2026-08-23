import { Types } from 'mongoose';

import { Account } from '../../src/database/account.model.js';
import { Bank } from '../../src/database/bank.model.js';
import { Media } from '../../src/database/media-upload.model.js';
import { User } from '../../src/database/user.model.js';
import { hashPassword } from '../../src/libs/utils/password-hash.js';

// Full account chain — user + image/aadhar/pan/resume Media docs + Bank + Account.
// Marking/approval flows zod-parse the populated account, so partial fixtures 500.
export async function createFullAccount(
  userOverrides: Record<string, unknown> = {},
  accountOverrides: Record<string, unknown> = {},
) {
  const [image, aadhar, pan, resume] = await Media.create([
    { alt: 'user-image', src: `/uploads/${new Types.ObjectId()}.webp` },
    { alt: 'aadhar', src: `/uploads/${new Types.ObjectId()}.webp` },
    { alt: 'pan', src: `/uploads/${new Types.ObjectId()}.webp` },
    { alt: 'resume', src: `/uploads/${new Types.ObjectId()}.webp` },
  ]);

  const user = await User.create({
    name: 'Att User',
    displayName: 'Att User',
    email: `att-${Date.now()}-${Math.random().toString(36).slice(2)}@test.dev`,
    password: await hashPassword('Password123!'),
    role: 'user',
    emailVerified: true,
    isActive: true,
    isBanned: false,
    image: image._id,
    ...userOverrides,
  });

  const bank = await Bank.create({
    accountHolderName: 'Att User',
    accountNumber: '98375923709349234',
    bankName: 'SAHER INDIA',
    branch: 'BRANCH',
    ifcs: 'SAHE0123456',
    mobileNumber: '9988776655',
  });

  const account = await Account.create({
    gender: 'other',
    dateOfBirth: new Date('1995-06-15'),
    dateOfJoining: new Date('2023-01-10'),
    phoneNumber: '9988776655',
    employeeId: `emp-${user._id}`,
    department: 'ENG',
    designation: 'DEV',
    employeeType: 'full-time',
    salaryStructure: '0000000',
    address: 'Test Address',
    user: user._id,
    bank: bank._id,
    aadhar: aadhar._id,
    pan: pan._id,
    resume: resume._id,
    ...accountOverrides,
  });

  return { user, account, bank };
}
