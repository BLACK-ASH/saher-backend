import { getLogoDataUri } from '../../libs/utils/pdf-config.js';

const formatDateTime = (date: Date | string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));

const formatMoney = (amount: number) =>
  `₹${Number(amount ?? 0).toLocaleString('en-IN')}`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

type AuditLogRow = {
  date: Date | string;
  description: string;
  amount: number;
  from: string;
  to: string;
};

// ponytail: ledger PDF mirrors bill-pdf's header/print styles; extend sheet
// formatting when finance asks.
export const createAuditLogPdfBody = (entries: AuditLogRow[]): string => {
  const total = entries.reduce((acc, e) => acc + Number(e.amount ?? 0), 0);
  const rows = entries
    .map(
      (e) => `
      <tr>
        <td>${formatDateTime(e.date)}</td>
        <td>${escapeHtml(e.description ?? '-')}</td>
        <td>${escapeHtml(e.from ?? '-')}</td>
        <td>${escapeHtml(e.to ?? '-')}</td>
        <td class="amt">${formatMoney(e.amount)}</td>
      </tr>`,
    )
    .join('');

  return `
  <div class="ledger-doc">
    <div class="r-header">
      ${
        getLogoDataUri()
          ? `<img src="${getLogoDataUri()}" alt="SAHER Logo" class="logo" />`
          : ''
      }
      <div>
        <div class="brand-name">SAHER Internal</div>
        <div class="muted">Society for Awareness, Harmony and Equal Rights</div>
      </div>
    </div>

    <h1>Books of Account</h1>
    <p class="muted">Organization ledger — money moved to / from the organization account.</p>

    <table class="ledger">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>From</th>
          <th>To</th>
          <th class="amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="foot">Total</td>
          <td class="amt foot">${formatMoney(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>
  <style>
    @page { size: A4; margin: 28px 32px; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif; color: #18181b; -webkit-print-color-adjust: exact; }
    .ledger-doc { display: flex; flex-direction: column; gap: 16px; }
    .r-header { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #e4e4e7; padding-bottom: 18px; }
    .logo { width: 44px; height: 44px; object-fit: cover; border-radius: 8px; }
    .brand-name { font-size: 17px; font-weight: 700; }
    .muted { font-size: 12px; color: #71717a; }
    h1 { font-size: 20px; margin-top: 8px; }
    .ledger { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ledger th, .ledger td { border: 1px solid #e4e4e7; padding: 8px 10px; text-align: left; vertical-align: top; word-wrap: break-word; }
    .ledger th { background: #f4f4f5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #52525b; }
    .ledger th.amt, .ledger td.amt { text-align: right; white-space: nowrap; }
    .ledger tbody tr:nth-child(even) { background: #fafafa; }
    .ledger tfoot td { border-top-width: 2px; font-weight: 700; background: #fafafa; }
  </style>`;
};