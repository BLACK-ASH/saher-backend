import ExcelJS from 'exceljs';
import type { HydratedDocument } from 'mongoose';

import { formatTime } from '../../libs/utils/format-time.js';
import type { SessionType } from '../../database/session.model.js';

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

type SessionDoc = HydratedDocument<SessionType>;
// populate('participants') hydrates ObjectIds into Participant docs; schema types don't reflect that
type PopulatedParticipant = { name?: string | null; phoneNumber?: string | null };
const populatedParticipants = (session: SessionDoc): PopulatedParticipant[] =>
  (session.participants ?? []) as unknown as PopulatedParticipant[];

// populate('program'/'workshop') hydrates ObjectIds into ref docs; schema types don't reflect that
type PopulatedMeta = { title?: string | null } | null;
const titleOf = (meta: unknown): string => (meta as PopulatedMeta)?.title ?? '-';

// ponytail: minimal column set (name/phone/status); extend when report needs more fields
export const createSessionExcel = async (
  session: SessionDoc,
  filePath: string,
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Session Attendance');

  sheet.columns = [
    { header: 'Participant', key: 'name', width: 24 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const participant of populatedParticipants(session)) {
    sheet.addRow({
      name: participant.name ?? '-',
      phone: participant.phoneNumber ?? '-',
      status: 'present',
    });
  }

  sheet.addRow([]);
  sheet.addRow(['Session', session.title]);
  sheet.addRow(['Program', titleOf(session.program)]);
  sheet.addRow(['Workshop', titleOf(session.workshop)]);
  sheet.addRow(['Date', formatDate(session.date)]);

  await workbook.xlsx.writeFile(filePath);
};
