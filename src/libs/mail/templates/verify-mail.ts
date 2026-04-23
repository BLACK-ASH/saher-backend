import 'dotenv/config';
const imgUrl = process.env.BASE_URL + '/uploads/images/c1821c2a-7a05-414c-a54d-b6780e205031.webp';

const date = new Date().toLocaleString();

type props = {
  name: string;
  verifyUrl: string;
  expiryTime: string;
};

export const verifyEmailTemplate = ({ name, verifyUrl, expiryTime }: props): string => `
<!DOCTYPE html>

<html>
  <head>
    <meta charset="UTF-8" />
    <title>Saher - Verify Your Email</title>
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
              <img src="${imgUrl}" alt="Saher Logo" width="42" height="42" style="display:block;" />
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
          Verify Your Email Address
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
          Dear ${name},
        </p>

        <p style="font-size:14px; color:#374151; margin:0 0 16px;">
          Please confirm your email address to activate your account in the Saher Internal System.
        </p>

        <p style="font-size:14px; color:#374151; margin:0 0 20px;">
          Click the button below to verify your email:
        </p>

        <!-- Button -->
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="rgb(124,0,141)" style="border-radius:6px;">
              <a href="${verifyUrl}" target="_blank"
                style="display:inline-block; padding:10px 22px; font-size:13px; color:#ffffff; text-decoration:none; font-weight:bold;">
                Verify Email
              </a>
            </td>
          </tr>
        </table>

        <!-- Fallback link -->
        <p style="font-size:13px; color:#6b7280; margin-top:16px;">
          If the button does not work, copy and paste the following link into your browser:
        </p>

        <p style="font-size:12px; color:#111827; word-break:break-all;">
          ${verifyUrl}
        </p>

        <hr style="margin:28px 0; border:none; border-top:1px solid #e5e7eb;" />

        <p style="font-size:13px; color:#b91c1c;">
          ⚠️ This verification link will expire in ${expiryTime}.
        </p>

        <p style="font-size:13px; color:#6b7280;">
          If you did not create this account, please ignore this email.
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
