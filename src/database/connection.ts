import mongoose from 'mongoose';
// import 'dotenv/config';

import { env } from '../config/env.js';
import { logger } from '../libs/logger/logger.js';

const connectDb = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('database connected.');
  } catch (error) {
    if (error instanceof Error) logger.error(error.stack, error.message);
    process.exit();
  }
};

export default connectDb;
