import ExcelJS from 'exceljs';
import type { HydratedDocument } from 'mongoose';

import type { SessionType } from '../../database/session.model.js';
import { htmlToText } from '../../libs/utils/html-to-text.js';

const formatDate = (date: unknown) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date as string));
};

const formatTime = (date: unknown) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date as string));
};

type SessionDoc = HydratedDocument<SessionType>;
// populate('participants'/'program.participants') hydrates ObjectIds into Participant docs
type PopulatedParticipant = { name?: string | null; phoneNumber?: string | null; _id?: unknown };
const populatedParticipants = (list: unknown): PopulatedParticipant[] =>
  (Array.isArray(list) ? list : []) as unknown as PopulatedParticipant[];

type PopulatedMeta = { title?: string | null } | null;
const titleOf = (meta: unknown): string => (meta as PopulatedMeta)?.title ?? '-';

type PopulatedBill = {
  description?: string | null;
  amount?: number | null;
  date?: Date | string | null;
  status?: string | null;
};

const populatePresentSet = (session: SessionDoc): Set<string> => {
  const present = (session.participants ?? []) as unknown as { _id?: unknown }[];
  return new Set(present.map((p) => String(p._id)));
};

export const createSessionExcel = async (
  session: SessionDoc,
  filePath: string,
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();

  // ===== Details sheet =====
  const details = workbook.addWorksheet('Session');
  const program = (session.program as unknown as { participants?: unknown }) ?? {};
  const roster = populatedParticipants(program.participants);
  const presentSet = populatePresentSet(session);

  details.addRow(['Section', 'Detail']);
  details.getRow(1).font = { bold: true };
  details.addRow(['Session', session.title ?? '-']);
  details.addRow(['Program', titleOf(session.program)]);
  details.addRow(['Workshop', titleOf(session.workshop)]);
  details.addRow(['Date', formatDate(session.date)]);
  details.addRow(['Time', `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`]);
  details.addRow(['Description', htmlToText(session.description ?? '-')]);
  details.columns = [{ width: 12 }, { width: 50 }];

  // ===== Attendance sheet =====
  const attendance = workbook.addWorksheet('Attendance');
  attendance.columns = [
    { header: 'Participant', key: 'name', width: 24 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  attendance.getRow(1).font = { bold: true };

  for (const participant of roster) {
    const present = presentSet.has(String(participant._id));
    attendance.addRow({
      name: participant.name ?? '-',
      phone: participant.phoneNumber ?? '-',
      status: present ? 'present' : 'absent',
    });
  }

  // ===== Bills sheet =====
  const bills = (session.bills ?? []) as unknown as PopulatedBill[];
  const billSheet = workbook.addWorksheet('Bills');
  billSheet.columns = [
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  billSheet.getRow(1).font = { bold: true };

  for (const bill of bills) {
    billSheet.addRow({
      description: bill.description ?? '-',
      date: formatDate(bill.date),
      amount: `₹${Number(bill.amount ?? 0).toLocaleString('en-IN')}`,
      status: bill.status ?? '-',
    });
  }

  await workbook.xlsx.writeFile(filePath);
};
