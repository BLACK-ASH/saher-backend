// Generates real, openable sample files for manual upload testing (node scripts/make-upload-samples.mjs)
/* eslint-disable no-console */
// Images must be genuinely decodable (backend runs sharp on them);
// documents only need correct bytes/mimetype but are made valid anyway.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const out = path.join(process.cwd(), 'samples');
await fs.mkdir(out, { recursive: true });

// 600x400 SVG-derived raster → png / jpg / webp / avif
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
     <rect width="600" height="400" fill="#7a1cac"/>
     <circle cx="300" cy="200" r="120" fill="#ffffff"/>
     <text x="300" y="210" font-family="Arial" font-size="36" fill="#7a1cac" text-anchor="middle">SAHER sample</text>
   </svg>`,
);

for (const [name, fmt] of [
  ['sample-image.png', 'png'],
  ['sample-image.jpg', 'jpeg'],
  ['sample-image.webp', 'webp'],
  ['sample-image.avif', 'avif'],
]) {
  await sharp(svg)[fmt]().toFile(path.join(out, name));
  console.log('wrote', name);
}

// Minimal valid PDF (1 page, blank)
const pdf = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj
xref
0 4
0000000000 65535 f 
trailer<</Size 4/Root 1 0 R>>
startxref
0
%%EOF`,
);
await fs.writeFile(path.join(out, 'sample-document.pdf'), pdf);
console.log('wrote sample-document.pdf');

// Real .xlsx via installed exceljs
const { default: ExcelJS } = await import('exceljs');
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Sample');
ws.columns = [
  { header: 'Item', key: 'item', width: 24 },
  { header: 'Qty', key: 'qty', width: 10 },
];
ws.addRow({ item: 'Sample row', qty: 1 });
await wb.xlsx.writeFile(path.join(out, 'sample-document.xlsx'));
console.log('wrote sample-document.xlsx');

