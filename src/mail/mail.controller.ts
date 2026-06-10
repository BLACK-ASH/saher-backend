import type { Request, Response } from 'express';

import { Mail } from '../database/mail.model.js';
import { User } from '../database/user.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';

export const inboxController = async (req: Request, res: Response) => {
  const user = req.user;

  const record = await Mail.find({ to: user?.id }).lean().sort({ createdAt: -1 });
  const length = record.length;
  if (length === 0) {
    return ApiResponse.success(res, {
      message: 'There are no mails for you',
      data: null,
      statusCode: 200,
    });
  }

  return ApiResponse.success(res, {
    message: 'The mails in your inbox are ',
    data: record,
    statusCode: 200,
  });
};

// export const sendMailController = async (req: Request, res: Response) => {
//   const user = req.user;

//   const { receiversIDs, cc, bcc, subject, body } = req.body;

//   if (!Array.isArray(receiversIDs) || receiversIDs.length === 0) {
//     throw new ApiError(400, ' ReceiversID must be a non empty array');
//   }

//   if (receiversIDs.includes(user?.id.toString())) {
//     throw new ApiError(400, 'You cannot send mail to yourself');
//   }

//   const receivers = await User.find({ _id: { $in: receiversIDs } });
//   if (receivers.length !== receiversIDs.length) {
//     throw new ApiError(404, 'Some users were not found');
//   }
//   const mails = await Mail.create({
//     from: user?.id,
//     to: receiversIDs,
//     subject: subject,
//     body: body,
//   });

//   return ApiResponse.success(res, {
//     message: `The mail has been sent to ${receiversIDs} `,
//     data: mails,
//     statusCode: 201,
//   });
// };

export const outboxController = async (req: Request, res: Response) => {
  const user = req.user;

  const record = await Mail.find({ from: user?.id });

  if (record.length === 0) {
    return ApiResponse.success(res, {
      message: 'There are no mails for you',
      data: null,
      statusCode: 200,
    });
  }

  return ApiResponse.success(res, {
    message: 'The mails sent by you are ',
    data: record,
    statusCode: 200,
  });
};
