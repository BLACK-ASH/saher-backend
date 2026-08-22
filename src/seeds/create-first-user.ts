import { randomUUID } from 'node:crypto';

import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { Account } from '../database/account.model.js';
import { Bank } from '../database/bank.model.js';
import { Media } from '../database/media-upload.model.js';
import { User, type UserRole } from '../database/user.model.js';
import { hashPassword } from '../libs/utils/password-hash.js';

// Fresh objects per invocation: module-level shared state made concurrent seeds
// collide on unique indexes (media src / employeeId) before email could decide.
const buildSeedData = (email: string, passwordHash: string) => {
  const image = {
    alt: 'first-images',
    src: `/uploads/images/seed-${randomUUID()}.webp`,
  };

  const user = {
    name: 'Admin_Saher',
    displayName: 'Admin Saher',
    role: 'admin' as UserRole,
    email,
    emailVerified: true,
    password: passwordHash,
  };

  const bank = {
    accountHolderName: 'Admin Saher',
    bankName: 'SAHER INDIA',
    accountNumber: '98375923709349234',
    ifcs: 'SAHE0123456',
    branch: 'BRANCH',
    mobileNumber: '9988776655',
  };

  const account = {
    gender: 'other' as const,
    dateOfBirth: new Date(),
    dateOfJoining: new Date(),
    phoneNumber: '9988776655',
    secondaryPhoneNumber: '9988776655',
    employeeId: `first-${randomUUID()}`,
    department: 'FIRST',
    designation: 'FIRST',
    employeeType: 'full-time' as const,
    salaryStructure: '0000000',
    address: 'First Address',
  };

  return { image, user, bank, account };
};

const createFirstUser = async () => {
  // Bootstrap credentials come from env — this account is the application entrypoint.
  const email = env.SEED_ADMIN_EMAIL || 'admin@saher.com';
  const { SEED_ADMIN_PASSWORD: password } = env;
  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD is required to seed the first admin (see .env.example).');
  }

  const session = await mongoose.startSession();
  try {
    const existing = await User.findOne();
    if (existing) return null;

    const passwordHash = await hashPassword(password);

    return await session.withTransaction(async () => {
      // Re-check inside the transaction so two racers can't both pass the pre-check.
      if (await User.exists({})) return null;

      const { image, user, bank, account } = buildSeedData(email, passwordHash);

      const media = await Media.create([image], { session });

      const createdUser = new User({ ...user, image: media[0]._id.toString() });
      await createdUser.save({ session });

      const createdBank = await Bank.create([bank], { session });

      await Account.create(
        [
          {
            user: createdUser._id,
            bank: createdBank[0]._id,
            aadhar: media[0]._id.toString(),
            pan: media[0]._id.toString(),
            resume: media[0]._id.toString(),
            ...account,
          },
        ],
        { session },
      );

      return createdUser;
    });
  } catch (err) {
    // Unique index on email lost the race against a concurrent seed → idempotent success.
    // Narrow to the email index only: other duplicates must fail loudly.
    const dup = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (dup.code === 11000 && dup.keyPattern && 'email' in dup.keyPattern) {
      return null;
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

export default createFirstUser;
