import fs from 'node:fs';
import path from 'node:path';

// Single source of truth for export PDF page layout — attendance's puppeteer
// config is the reference; session and bill exports share it via this helper.
export const pdfPageConfig = {
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  margin: {
    top: '40px',
    bottom: '70px',
    left: '20px',
    right: '20px',
  },
} as const;

let logoDataUri = '';
try {
  const logoPath = path.join(process.cwd(), 'public', 'saher-logo.png');
  if (fs.existsSync(logoPath)) {
    logoDataUri = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  }
} catch {
  // branding is cosmetic — render a text-only header if the logo can't be read
}

export const getLogoDataUri = () => logoDataUri;

export const pdfFooterTemplate = `
    <div
      style="
        width:100%;
        padding:0 24px;
        font-size:10px;
        color:#71717a;
        font-family:Arial,sans-serif;
        display:flex;
        justify-content:space-between;
        align-items:center;
      "
    >
      <div style="font-weight:600;color:#7a1cac;">
        SAHER Internal
      </div>
      <div>
        Designed & Developed by
        <span style="font-weight:600;color:black">
          BlackAsh
        </span>
      </div>
      <div>
        Page
        <span class="pageNumber"></span>
        of
        <span class="totalPages"></span>
      </div>
    </div>
  `;