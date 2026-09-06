import ExcelJS from 'exceljs';

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));

type AuditLogRow = {
  date: Date | string;
  description: string;
  amount: number;
  from: string;
  to: string;
};

// ponytail: minimal ledger columns; extend when finance asks.
export const createAuditLogExcel = async (
  entries: AuditLogRow[],
  filePath: string,
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Books of Account');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Description', key: 'description', width: 45 },
    { header: 'From', key: 'from', width: 24 },
    { header: 'To', key: 'to', width: 24 },
    { header: 'Amount', key: 'amount', width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const entry of entries) {
    sheet.addRow({
      date: formatDate(entry.date),
      description: entry.description ?? '',
      from: entry.from ?? '',
      to: entry.to ?? '',
      amount: entry.amount,
    });
  }

  const total = entries.reduce((acc, e) => acc + Number(e.amount ?? 0), 0);
  sheet.addRow([]);
  sheet.addRow(['Total', '', '', '', total]);

  await workbook.xlsx.writeFile(filePath);
};