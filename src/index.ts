import app from './app.js';
import { env } from './config/env.js';
import connectDb from './database/connection.js';
import { logger } from './libs/logger/logger.js';
import { connectRedis } from './libs/redis/redis-client.js';

// Databse Connection
await connectDb();

//Redis Server Connnection
await connectRedis();

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`server started at http://localhost:${PORT}`);
});
