import ExcelJS from 'exceljs';

import type { BillDocumentT } from './types.js';

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

// ponytail: minimal column set (user/amount/status/date); extend when finance asks
export const createBillExcel = async (
  bills: BillDocumentT[],
  filePath: string,
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Bills');

  sheet.columns = [
    { header: 'Employee', key: 'user', width: 26 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Advance', key: 'advance', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Description', key: 'description', width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const bill of bills) {
    sheet.addRow({
      user: bill.user?.displayName ?? bill.user?.email ?? '-',
      amount: bill.amount,
      advance: bill.advance,
      status: bill.status,
      date: formatDate(bill.date),
      description: bill.description ?? '',
    });
  }

  const totalAmount = bills.reduce((acc, b) => acc + (b.amount ?? 0), 0);
  const totalAdvance = bills.reduce((acc, b) => acc + (b.advance ?? 0), 0);
  sheet.addRow([]);
  sheet.addRow(['Total', totalAmount, totalAdvance]);
  sheet.addRow(['Count', bills.length]);

  await workbook.xlsx.writeFile(filePath);
};
