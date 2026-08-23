import ExcelJS from 'exceljs';

import { formatTime } from '../../libs/utils/format-time.js';
import type { AttendanceResponseT } from '../retrieve/attendance.schema.js';

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

// Writes data.parsed rows to filePath as .xlsx; mirrors the PDF report layout
export const createAttendanceExcel = async (
  data: AttendanceResponseT[],
  filePath: string,
): Promise<void> => {
  const user = data[0]?.user;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Check In', key: 'inTime', width: 14 },
    { header: 'Check Out', key: 'outTime', width: 14 },
    { header: 'Hours', key: 'workHours', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Late', key: 'isLate', width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const record of data) {
    sheet.addRow({
      date: formatDate(record.date),
      inTime: formatTime(record.inTime),
      outTime: formatTime(record.outTime),
      workHours: Number(record.workHours.toFixed(1)),
      status: record.status,
      isLate: record.isLate ? 'Late' : 'On Time',
    });
  }

  const countByStatus = (status: AttendanceResponseT['status']) =>
    data.filter((d) => d.status === status).length;

  sheet.addRow([]);
  sheet.addRow(['Employee', user?.name ?? '-', 'Email', user?.email ?? '-', 'Role', user?.role ?? '-']);
  sheet.addRow([
    'Period',
    data.length ? `${formatDate(data[0].date)} - ${formatDate(data[data.length - 1].date)}` : '-',
  ]);
  sheet.addRow([
    'Present',
    countByStatus('present'),
    'Half Day',
    countByStatus('half-day'),
    'Absent',
    countByStatus('absent'),
  ]);
  sheet.addRow(['Total Hours', Number(data.reduce((acc, curr) => acc + curr.workHours, 0).toFixed(1))]);

  await workbook.xlsx.writeFile(filePath);
};
