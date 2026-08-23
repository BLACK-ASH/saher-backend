import { Resend } from 'resend';

import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

// Lazy init — import-time construction breaks env-less contexts (tests, seeds)
let resend: Resend | undefined;
const getResend = () => (resend ??= new Resend(env.RESEND_API_KEY));

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
    const response = await getResend().emails.send({
      from: 'Saher Dev <noreply@saherindia.org>',
      to,
      subject,
      html,
    });

    return response;
  } catch (error) {
    logger.error({ err: error }, 'Email error');
    throw error;
  }
};
