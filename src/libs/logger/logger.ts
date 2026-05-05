import pino from 'pino';

export const logger = pino({
  level: 'info',
  base: null,
  timestamp: pino.stdTimeFunctions.isoTime,
});
