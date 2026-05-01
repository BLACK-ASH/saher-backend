import mongoose from 'mongoose';
import { logger } from '../libs/logger/logger.js';

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    logger.info('database connected.');
  } catch (error) {
    if (error instanceof Error) logger.error(error.stack, error.message);
    process.exit();
  }
};

export default connectDb;
