import mongoose from 'mongoose';

import createFirstUser from './create-first-user.js';
import { env } from '../config/env.js';

const run = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    // WARN:Remove This After Development
    // eslint-disable-next-line no-console
    console.log('DB connected for seed');

    const seeded = await createFirstUser();
    if (seeded) {
      // eslint-disable-next-line no-console
      console.log(`Seeded first admin: ${seeded.email} (credentials from SEED_ADMIN_* env)`);
    } else {
      // eslint-disable-next-line no-console
      console.log('Users already exist — seed skipped (idempotent).');
    }

    // WARN:Remove This After Development
    // eslint-disable-next-line no-console
    console.log('Seed executed');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
