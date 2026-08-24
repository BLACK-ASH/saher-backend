/**
 * IST (Asia/Kolkata) timezone date utilities.
 * Used for day/month boundaries in queries — server TZ must never be used.
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get start of day in IST (00:00:00.000)
 */
export const startOfDayIST = (date: Date): Date => {
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  istDate.setHours(0, 0, 0, 0);
  return new Date(istDate.toLocaleString('en-US', { timeZone: 'UTC' }));
};

/**
 * Get end of day in IST (23:59:59.999)
 */
export const endOfDayIST = (date: Date): Date => {
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  istDate.setHours(23, 59, 59, 999);
  return new Date(istDate.toLocaleString('en-US', { timeZone: 'UTC' }));
};

/**
 * Get start of month in IST (1st day, 00:00:00.000)
 */
export const startOfMonthIST = (year: number, month: number): Date => {
  const istDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  // Convert to IST midnight
  return new Date(istDate.toLocaleString('en-US', { timeZone: 'UTC' }));
};

/**
 * Get end of month in IST (last day, 23:59:59.999)
 */
export const endOfMonthIST = (year: number, month: number): Date => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getDate();
  const istDate = new Date(Date.UTC(year, month, lastDay, 23, 59, 59, 999));
  return new Date(istDate.toLocaleString('en-US', { timeZone: 'UTC' }));
};

/**
 * Parse ISO date string and return IST day boundaries for range queries.
 * Returns [startOfDay, endOfDay] as UTC Date objects that represent IST day boundaries.
 */
export const istDayRange = (isoDateString: string): [Date, Date] => {
  const inputDate = new Date(isoDateString);
  if (Number.isNaN(inputDate.getTime())) {
    throw new Error(`Invalid date string: ${isoDateString}`);
  }
  return [startOfDayIST(inputDate), endOfDayIST(inputDate)];
};

/**
 * Check if a date string is valid ISO format
 */
export const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
};