import mongoose from 'mongoose';

import createFirstUser from './create-first-user.js';
import { env } from '../config/env.js';

const run = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    // WARN:Remove This After Development
    // eslint-disable-next-line no-console
    console.log('DB connected for seed');

    await createFirstUser();

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
