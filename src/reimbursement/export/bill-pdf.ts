import fs from 'node:fs';
import path from 'node:path';

import type { BillDocumentT } from './types.js';
import { escapeHtml } from '../../libs/utils/html-escape.js';
import { getLogoDataUri } from '../../libs/utils/pdf-config.js';

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const formatMoney = (n: number | undefined) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN')}`;

// receipts are webp files on disk (public + src, e.g. /uploads/images/x.webp)
const receiptDataUri = (src: string) => {
  try {
    const filePath = path.join(process.cwd(), 'public', src);
    if (fs.existsSync(filePath)) {
      return `data:image/webp;base64,${fs.readFileSync(filePath).toString('base64')}`;
    }
  } catch {
    // missing/unreadable receipt is not a reason to fail the whole export
  }
  return '';
};

const receiptThumbs = (b: BillDocumentT) => {
  const thumbs = (b.images ?? [])
    .map((img) => {
      const src = receiptDataUri(img.src);
      return src
        ? `<img src="${src}" alt="${escapeHtml(img.alt ?? 'Receipt')}" class="thumb" />`
        : '';
    })
    .join('');
  return thumbs || '<span class="muted">—</span>';
};

const renderTable = (bills: BillDocumentT[]) => `
  <div class="header">
    <div class="brand-name">SAHER Internal</div>
    <div style="font-size:11px;color:#71717a;">Society for Awareness, Harmony and Equal Rights</div>
  </div>
  <h1 style="font-size:18px;">Bill Report</h1>
  <table>
    <thead><tr><th>Employee</th><th>Description</th><th>Receipts</th><th>Amount</th><th>Advance</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>
      ${bills
        .map(
          (b) => `<tr>
            <td>${escapeHtml(b.user?.displayName ?? b.user?.email ?? '-')}</td>
            <td>${escapeHtml(b.description ?? '-')}</td>
            <td>${receiptThumbs(b)}</td>
            <td>${b.amount ?? 0}</td>
            <td>${b.advance ?? 0}</td>
            <td>${escapeHtml(String(b.status))}</td>
            <td>${formatDate(b.date)}</td>
          </tr>`,
        )
        .join('')}
    </tbody>
  </table>`;

const renderDetail = (b: BillDocumentT) => {
  const receipts = (b.images ?? [])
    .map((img) => {
      const src = receiptDataUri(img.src);
      return src
        ? `<img src="${src}" alt="${escapeHtml(img.alt ?? 'Receipt')}" class="rcpt" />`
        : '';
    })
    .join('');

  return `
  <div class="receipt">
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

    <div class="r-meta">
      <div class="r-meta-item">
        <span class="muted">Bill Ref</span>
        <strong>#${String(b._id).slice(-8).toUpperCase()}</strong>
      </div>
      <div class="r-meta-item">
        <span class="muted">Attended By</span>
        <strong>${escapeHtml(b.user?.displayName ?? '-')}</strong>
      </div>
      <div class="r-meta-item">
        <span class="muted">Submitted</span>
        <strong>${formatDate(b.date)}</strong>
      </div>
      <div class="r-meta-item">
        <span class="muted">Status</span>
        <strong class="status-badge status-${escapeHtml(String(b.status))}">${escapeHtml(String(b.status))}</strong>
      </div>
    </div>

    <h1>Bill Details</h1>

    <div class="rows">
      <div class="row">
        <span class="muted">Employee</span>
        <span class="row-value">${escapeHtml(b.user?.displayName ?? '-')}${
          b.user?.email ? ` <span class="muted">(${escapeHtml(b.user.email)})</span>` : ''
        }</span>
      </div>
      <div class="row">
        <span class="muted">Description</span>
        <span class="row-value">${escapeHtml(b.description ?? '-')}</span>
      </div>
      ${
        b.reason
          ? `<div class="row"><span class="muted">Reason</span><span class="row-value">${escapeHtml(b.reason)}</span></div>`
          : ''
      }
      <div class="row">
        <span class="muted">Bill Date</span>
        <span class="row-value">${formatDate(b.date)}</span>
      </div>
    </div>

    <div class="amt-card">
      <div class="amt-item">
        <span class="muted">Amount</span>
        <strong>${formatMoney(b.amount)}</strong>
      </div>
      <div class="amt-item">
        <span class="muted">Advance</span>
        <strong>${formatMoney(b.advance)}</strong>
      </div>
      <div class="amt-item payable">
        <span class="muted">Payable</span>
        <strong>${formatMoney(Number(b.amount ?? 0) - Number(b.advance ?? 0))}</strong>
      </div>
    </div>

    ${receipts ? `<div class="r-rcpts"><h2>Receipts</h2>${receipts}</div>` : ''}
  </div>`;
};

export const createBillPdfBody = (bills: BillDocumentT[]) => {
  const body = bills.length === 1 ? renderDetail(bills[0]) : renderTable(bills);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #09090b; font-family: Inter, Arial, sans-serif; }
    .muted { color: #71717a; }
    .brand-name { font-size: 17px; font-weight: 700; color: #7a1cac; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 12px 14px; font-size: 12px; color: #71717a; border-bottom: 1px solid #e4e4e7; background: #fafafa; }
    td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f4f4f5; }
    @page { size: A4; margin: 8mm; }

    .receipt { display: flex; flex-direction: column; gap: 18px; }
    .r-header { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #e4e4e7; padding-bottom: 18px; }
    .r-header .logo { height: 44px; width: auto; }
    .r-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .r-meta-item { display: flex; flex-direction: column; gap: 4px; background: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px; padding: 12px; }
    .r-meta-item .muted { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    h1 { font-size: 20px; margin: 4px 0 0; }
    h2 { font-size: 15px; margin: 0 0 10px; }
    .rows { display: flex; flex-direction: column; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; }
    .row { display: flex; gap: 16px; padding: 12px 14px; border-bottom: 1px solid #f4f4f5; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .row .muted { width: 120px; flex-shrink: 0; }
    .row-value { flex: 1; }
    .amt-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .amt-item { display: flex; flex-direction: column; gap: 4px; border: 1px solid #e4e4e7; border-radius: 8px; padding: 14px; font-size: 15px; }
    .amt-item .muted { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .amt-item.payable { background: #faf5ff; border-color: #d8b4fe; }
    .r-rcpts { display: flex; flex-direction: column; gap: 10px; }
    .rcpt { width: 160px; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid #e4e4e7; }
    .thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #e4e4e7; margin-right: 4px; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; text-transform: capitalize; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-accept { background: #dcfce7; color: #166534; }
    .status-reject { background: #fee2e2; color: #991b1b; }
    .status-on-hold { background: #e4e4e7; color: #44403c; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
};