import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import ExcelJS from 'exceljs';

import { createAttendanceExcel } from '../../src/attendance/export/excel.service.js';
import type { AttendanceListT } from '../../src/attendance/retrieve/attendance.schema.js';

// 04:30 UTC = 10:00 IST — deterministic under formatTime's Asia/Kolkata zone
const row = {
  id: '1',
  user: { name: 'Test User', email: 'test@user.dev', role: 'user' },
  inTime: '2026-08-01T04:30:00.000Z',
  outTime: '2026-08-01T13:00:00.000Z',
  workHours: 8.56,
  date: '2026-08-01',
  status: 'present',
  overtime: false,
  isLate: false,
} as unknown as AttendanceListT[number];

const absentRow = {
  ...row,
  id: '2',
  date: '2026-08-02',
  workHours: 0,
  inTime: null,
  outTime: null,
  status: 'absent' as const,
} as unknown as AttendanceListT[number];

describe('createAttendanceExcel', () => {
  it('writes a valid xlsx with headers, rows and summary', async () => {
    const filePath = path.join(os.tmpdir(), `attendance-test-${Date.now()}.xlsx`);

    try {
      await createAttendanceExcel([row, absentRow], filePath);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];

      expect(sheet.getRow(1).getCell(1).value).toBe('Date');
      expect(sheet.getRow(1).getCell(4).value).toBe('Hours');
      expect(sheet.getRow(1).getCell(6).value).toBe('Late');

      expect(sheet.getRow(2).getCell(1).value).toBe('01 Aug 2026');
      expect(sheet.getRow(2).getCell(2).value).toBe('10:00:00 am');
      expect(sheet.getRow(2).getCell(4).value).toBe(8.6);
      expect(sheet.getRow(2).getCell(5).value).toBe('present');
      expect(sheet.getRow(2).getCell(6).value).toBe('On Time');

      // null times render as '-', not crashes
      expect(sheet.getRow(3).getCell(2).value).toBe('-');
      expect(sheet.getRow(3).getCell(5).value).toBe('absent');

      const values = sheet.getSheetValues().flat().map(String);
      expect(values).toContain('Test User');
      expect(values.join()).toContain('Total Hours');
    } finally {
      await fs.rm(filePath, { force: true });
    }
  });
});
