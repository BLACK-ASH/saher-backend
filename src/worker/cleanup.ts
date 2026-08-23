import fs from 'fs/promises';
import path from 'path';
import { Queue, Worker } from 'bullmq';
import { bullmqConnection } from '../libs/redis/redis-client.js';
import { logger } from '../libs/logger/logger.js';

const tempPath = path.join(process.cwd(), 'public', 'temp');

export const cleanupTempFiles = async () => {
  logger.info('Starting temporary files cleanup.');
  try {
    if (!(await fs.stat(tempPath).catch(() => null))) return;
    const files = await fs.readdir(tempPath);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempPath, file);
      // per-file guard — one unreadable entry must not abort the sweep
      const stats = await fs.stat(filePath).catch(() => null);
      if (!stats?.isFile()) continue;
      if (now - stats.mtimeMs > twentyFourHours) {
        await fs.unlink(filePath);
        logger.info(`Deleted old temp file: ${file}`);
      }
    }
  } catch (err) {
    logger.error(err, 'Error during cleanup job');
  }
};

export const cleanupQueue = new Queue('cleanup-temp-files', {
  connection: bullmqConnection,
});

// Hourly sweep keeps effective retention at ~24h; non-blocking so worker boot
// doesn't crash when Redis is briefly unavailable.
cleanupQueue
  .upsertJobScheduler('temp-cleanup-sweep', {
    every: 60 * 60 * 1000, // 1 hour
  })
  .catch((err: unknown) => logger.error(err, 'Failed to register cleanup schedule'));

export const cleanupWorker = new Worker(
  'cleanup-temp-files',
  cleanupTempFiles,
  {
    connection: bullmqConnection,
  },
);

cleanupWorker.on('completed', () => logger.info('Cleanup job completed.'));
cleanupWorker.on('failed', (job, err) => logger.error(err, 'Cleanup job failed'));
