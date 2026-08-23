import 'dotenv/config';

import { escapeHtml } from '../../utils/html-escape.js';

type Props = {
  name: string;
  email: string;
  role: string;
};

export const onboardEmailTemplate = ({ name, email, role }: Props): string => {
  const date = new Date().toLocaleString();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role);
  return `
<!DOCTYPE html>

<html>
  <head>
    <meta charset="UTF-8" />
    <title>Saher - Account Created</title>
  </head>

  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
  <tr>
    <td align="center">

  <!-- Main Container -->
  <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e5e7eb;">

    <!-- Top Branding Bar -->
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

            <!-- Organization Name -->
            <td align="left" style="padding-left:10px;">
              <p style="margin:0; font-size:16px; font-weight:bold; color:rgb(124,0,141);">
                Saher India.
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
          Account Successfully Created
        </h2>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:0 24px 24px;">

        <!-- ✅ Date here -->
        <p style="font-size:13px; color:#6b7280; margin:0 0 12px;">
          Date: ${date}
        </p>

        <p style="font-size:14px; color:#111827; margin:0 0 12px;">
          Dear ${safeName},
        </p>

        <p style="font-size:14px; color:#374151; margin:0 0 16px;">
          We are pleased to inform you that your account has been successfully created in the Saher Internal System.
        </p>

        <p style="font-size:14px; color:#374151; margin:0 0 16px;">
          You may log in using your registered email:
          <strong>${safeEmail}</strong>
        </p>

        <!-- Credential Format -->
        <p style="font-size:14px; color:#374151; margin:0 0 10px;">
          Your initial password is generated automatically using your registered details in the following format:
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; border-left:4px solid rgb(124,0,141); padding:14px; margin-bottom:20px;">
          <tr>
            <td style="font-size:13px; color:#111827;">
              <strong>Format:</strong> FIRST NAME (in uppercase) + YEAR OF BIRTH<br/><br/>

              <strong>Example:</strong><br/>
              Name: John Doe<br/>
              Date of Birth: 21/12/2000<br/>
              Password: <strong>JOHN2000</strong>
            </td>
          </tr>
        </table>

        <p style="font-size:14px; color:#374151; margin:0 0 20px;">
          You may now access the platform as ${safeRole}
        </p>

        <!-- Button -->
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="rgb(124,0,141)" style="border-radius:6px;">
              <a href="${process.env.BASE_URL}/login" target="_blank"
                style="display:inline-block; padding:10px 22px; font-size:13px; color:#ffffff; text-decoration:none; font-weight:bold;">
                Access Your Account
              </a>
            </td>
          </tr>
        </table>

        <hr style="margin:28px 0; border:none; border-top:1px solid #e5e7eb;" />

        <p style="font-size:13px; color:#b91c1c;">
          ⚠️ For security reasons, you are required to change your password immediately after logging in.
        </p>

        <p style="font-size:13px; color:#6b7280;">
          If you did not expect this email, please contact the administrator.
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
