import { describe, expect, it } from 'vitest';

import { calculateWorkStatus } from '../../src/libs/utils/calculate-work-status.js';

describe('calculateWorkStatus', () => {
  it('clamps workHours to zero when out time precedes in time', () => {
    const result = calculateWorkStatus({
      inTime: new Date('2026-09-05T12:00:00+05:30'),
      outTime: new Date('2026-09-05T10:00:00+05:30'),
      shift: 'full-time',
    });
    expect(result.workHours).toBe(0);
  });

  it('clamps free-shift workHours to zero', () => {
    const result = calculateWorkStatus({
      inTime: new Date('2026-09-05T12:00:00+05:30'),
      outTime: new Date('2026-09-05T11:00:00+05:30'),
      shift: 'free',
    });
    expect(result.workHours).toBe(0);
    expect(result.status).toBe('present');
  });
});