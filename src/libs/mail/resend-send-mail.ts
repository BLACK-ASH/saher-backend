import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const response = await resend.emails.send({
      from: 'Saher Dev <noreply@saherindia.org>',
      to,
      subject,
      html,
    });

    return response;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};
