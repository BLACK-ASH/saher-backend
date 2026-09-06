import '../config/env.js';

import connectDb from '../database/connection.js';
import { logger } from '../libs/logger/logger.js';
import { connectRedis } from '../libs/redis/redis-client.js';
import './attendance-report.js';
import './attendance-sync.js';
import './audit-log-report.js';
import './bill-report.js';
import './cleanup.js';
import './model.js';
import './session-report.js';

await connectDb();
await connectRedis();
logger.info('All Worker Started.');
