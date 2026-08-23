import 'dotenv/config';

import { escapeHtml } from '../../utils/html-escape.js';

type Props = {
  name: string;
  url: string;
  expiryTime: string;
};

export const changePasswordTemplate = ({ name, url, expiryTime }: Props): string => {
  const date = new Date().toLocaleString();
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);
  const safeExpiryTime = escapeHtml(expiryTime);
  return `

<!DOCTYPE html>

<html>
  <head>
    <meta charset="UTF-8" />
    <title>Saher - Change Password</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
  <tr>
    <td align="center">

  <!-- Main Container -->
  <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e5e7eb;">

    <!-- Top Bar -->
    <tr>
      <td style="height:6px; background:rgb(124,0,141);"></td>
    </tr>

    <!-- Header -->
    <tr>
      <td style="padding:16px 24px; background:#faf5ff; border-bottom:1px solid #e5e7eb;">
        <table width="100%">
          <tr>
            <td align="left">
          <img
            src="https://${process.env.BASE_URL}/saher-logo.png"
            alt="SAHER Logo"
            class="logo"
          />
            </td>

            <td align="left" style="padding-left:10px;">
              <p style="margin:0; font-size:16px; font-weight:bold; color:rgb(124,0,141);">
                Saher Foundation
              </p>
              <p style="margin:0; font-size:12px; color:#6b7280;">
                Internal Management System
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Title -->
    <tr>
      <td style="padding:24px;">
        <h2 style="margin:0; font-size:20px; color:#111827;">
          Secure Password Reset Access
        </h2>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:0 24px 24px;">

        <p style="font-size:13px; color:#6b7280; margin:0 0 12px;">
          Date: ${date}
        </p>

        <p style="font-size:14px; color:#111827; margin:0 0 12px;">
          Dear ${safeName},
        </p>

        <p style="font-size:14px; color:#374151; margin:0 0 16px;">
          We received a request to reset the password for your Saher account.
        </p>

        <p style="font-size:14px; color:#374151; margin:0 0 20px;">
          To proceed securely, please use the link below. This will open a password reset form where you can set a new password.
        </p>

        <!-- Button -->
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="rgb(124,0,141)" style="border-radius:6px;">
              <a href="${safeUrl}" target="_blank"
                style="display:inline-block; padding:10px 22px; font-size:13px; color:#ffffff; text-decoration:none; font-weight:bold;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>

        <!-- Fallback -->
        <p style="font-size:13px; color:#6b7280; margin-top:16px;">
          If the button does not work, use this link:
        </p>

        <p style="font-size:12px; color:#111827; word-break:break-all;">
          ${safeUrl}
        </p>

        <hr style="margin:28px 0; border:none; border-top:1px solid #e5e7eb;" />

        <p style="font-size:13px; color:#b91c1c;">
          ⚠️ This link will expire in ${safeExpiryTime}. If you did not request this, your account may be at risk.
        </p>

        <p style="font-size:13px; color:#6b7280;">
          For security reasons, never share this link with anyone.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:16px 24px; background:#f0fdf4; border-top:1px solid #e5e7eb;">
        <p style="margin:0; font-size:12px; color:#166534;">
          This is an automated message. Please do not reply directly.
        </p>
        <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">
          © 2026 Saher Foundation
        </p>
      </td>
    </tr>

  </table>

</td>

  </tr>
</table>

  </body>
</html>
  `;
};
