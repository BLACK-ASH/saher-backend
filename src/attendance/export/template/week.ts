import { formatTime } from '../../../libs/utils/format-time.js';
import type { AttendanceResponseT } from '../../retrieve/attendance.schema.js';
import 'dotenv/config';

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const createWeekBody = (data: AttendanceResponseT[]) => {
  const totalPresent = data.filter((d) => d.status === 'present').length;

  const totalAbsent = data.filter((d) => d.status === 'absent').length;

  const totalHalfDay = data.filter((d) => d.status === 'half-day').length;

  const totalHours = data.reduce((acc, curr) => acc + curr.workHours, 0);

  const user = data[0]?.user;

  // Since data is sorted
  const weekStart = data[0]?.date;
  const weekEnd = data[data.length - 1]?.date;

  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 32px;
      background: #ffffff;
      color: #09090b;
      font-family: Inter, Arial, sans-serif;
      line-height: 1.5;
    }

    .container {
      width: 100%;
    }

    .header {
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }

    .brand-content {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 17px;
      font-weight: 700;
      color: #7a1cac;
      letter-spacing: -0.3px;
    }

    .brand-subtitle {
      font-size: 11px;
      color: #71717a;
    }

    .generated-at {
      font-size: 12px;
      color: #71717a;
    }

    .title {
      margin-top: 20px;
      text-align: center;
    }

    .title h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #09090b;
      letter-spacing: -0.3px;
    }

    .title p {
      margin-top: 4px;
      font-size: 12px;
      color: #71717a;
    }

    .user-card {
      margin-bottom: 20px;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      padding: 16px;
      background: #fafafa;
    }

    .user-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px 24px;
    }

    .field-label {
      font-size: 11px;
      color: #71717a;
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 13px;
      font-weight: 500;
      color: #09090b;
    }

    .summary {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #52525b;
    }

    .summary strong {
      color: #09090b;
      font-weight: 600;
    }

    .table-wrapper {
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #fafafa;
    }

    th {
      text-align: left;
      padding: 14px 16px;
      font-size: 12px;
      font-weight: 600;
      color: #71717a;
      border-bottom: 1px solid #e4e4e7;
    }

    td {
      padding: 14px 16px;
      font-size: 13px;
      border-bottom: 1px solid #f4f4f5;
      color: #18181b;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:nth-child(even) {
      background: #fcfcfd;
    }

    .status {
      text-transform: capitalize;
      font-weight: 500;
    }

    .present {
      color: #15803d;
    }

    .absent {
      color: #dc2626;
    }

    .half-day {
      color: #ca8a04;
    }

    .late {
      color: #dc2626;
      font-weight: 500;
    }

    .on-time {
      color: #15803d;
      font-weight: 500;
    }

    @page {
      size: A4;
      margin: 8mm;
    }
  </style>
</head>

<body>

  <div class="container">

    <div class="header">

      <div class="brand-row">

        <div class="brand">

          <img
            src="https://${process.env.BASE_URL}/saher-logo.png"
            alt="SAHER Logo"
            class="logo"
          />

          <div class="brand-content">

            <div class="brand-name">
              SAHER Internal
            </div>

            <div class="brand-subtitle">
              Society for Awareness, Harmony and Equal Rights
            </div>

          </div>

        </div>

        <div class="generated-at">
          Generated on ${formatDate(new Date().toISOString())}
        </div>

      </div>

      <div class="title">

        <h1>
          Attendance Report
        </h1>

        <p>
          ${weekStart && weekEnd ? `${formatDate(weekStart)} — ${formatDate(weekEnd)}` : '-'}
        </p>

      </div>

    </div>

    <div class="user-card">

      <div class="user-grid">

        <div>
          <div class="field-label">
            Employee Name
          </div>

          <div class="field-value">
            ${user?.name ?? '-'}
          </div>
        </div>

        <div>
          <div class="field-label">
            Employee Role
          </div>

          <div class="field-value">
            ${user?.role ?? '-'}
          </div>
        </div>

        <div>
          <div class="field-label">
            Email Address
          </div>

          <div class="field-value">
            ${user?.email ?? '-'}
          </div>
        </div>

      </div>

    </div>

    <div class="summary">

      <div>
        Present:
        <strong>${totalPresent}</strong>
      </div>

      <div>
        Half Day:
        <strong>${totalHalfDay}</strong>
      </div>

      <div>
        Absent:
        <strong>${totalAbsent}</strong>
      </div>

      <div>
        Total Hours:
        <strong>${totalHours.toFixed(1)}</strong>
      </div>

    </div>

    <div class="table-wrapper">

      <table>

        <thead>
          <tr>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Hours</th>
            <th>Status</th>
            <th>Late</th>
          </tr>
        </thead>

        <tbody>

          ${data
            .map(
              (attendance) => `
                <tr>

                  <td>
                    ${formatDate(attendance.date)}
                  </td>

                  <td>
                    ${formatTime(attendance.inTime)}
                  </td>

                  <td>
                    ${formatTime(attendance.outTime)}
                  </td>

                  <td>
                    ${attendance.workHours.toFixed(1)} hrs
                  </td>

                  <td>
                    <span class="status ${attendance.status}">
                      ${attendance.status}
                    </span>
                  </td>

                  <td>
                    <span class="${attendance.isLate ? 'late' : 'on-time'}">
                      ${attendance.isLate ? 'Late' : 'On Time'}
                    </span>
                  </td>

                </tr>
              `,
            )
            .join('')}

        </tbody>

      </table>

    </div>

  </div>

</body>
</html>
  `;
};
