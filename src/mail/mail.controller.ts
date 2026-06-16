import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import z from 'zod';

import { OutBoxMailSchema, sendMailSchema } from './mail.schema.js';
import { Mail } from '../database/mail.model.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { getInboxMails, sendMail } from '../libs/utils/mail.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';

export const getInboxController = async (req: Request, res: Response) => {
  const userId = req.user!.id.toString();

  const mails = await getInboxMails(userId);

  const normalized = normalizeDoc(mails);

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Inbox fetched successfully',
    data: normalized,
  });
};
export const sendMailController = async (req: Request, res: Response) => {
  const data = sendMailSchema.parse(req.body);

  const mails = await sendMail({
    senderId: req.user!.id.toString(),
    ...data,
  });

  return ApiResponse.success(res, {
    statusCode: 201,
    message: 'Mail sent successfully',
    data: null,
  });
};

export const outboxController = async (req: Request, res: Response) => {
  const user = req.user;

  const record = await Mail.aggregate([
    {
      $match: {
        from: new mongoose.Types.ObjectId(user!.id),
      },
    },

    // Populate sender
    {
      $lookup: {
        from: 'users',
        let: {
          senderId: '$from',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$senderId'],
              },
            },
          },
          {
            $lookup: {
              from: 'media',
              localField: 'image',
              foreignField: '_id',
              as: 'image',
            },
          },
          {
            $unwind: {
              path: '$image',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              role: 1,
              image: 1,
            },
          },
        ],
        as: 'from',
      },
    },
    {
      $unwind: '$from',
    },

    // Populate recipients
    {
      $lookup: {
        from: 'users',
        let: {
          recipientIds: '$to',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', '$$recipientIds'],
              },
            },
          },
          {
            $lookup: {
              from: 'media',
              localField: 'image',
              foreignField: '_id',
              as: 'image',
            },
          },
          {
            $unwind: {
              path: '$image',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              role: 1,
              image: 1,
            },
          },
        ],
        as: 'to',
      },
    },
    {
      $lookup: {
        from: 'users',
        let: {
          recipientIds: '$cc',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', '$$recipientIds'],
              },
            },
          },
          {
            $lookup: {
              from: 'media',
              localField: 'image',
              foreignField: '_id',
              as: 'image',
            },
          },
          {
            $unwind: {
              path: '$image',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              role: 1,
              image: 1,
            },
          },
        ],
        as: 'cc',
      },
    },
    {
      $lookup: {
        from: 'users',
        let: {
          recipientIds: '$bcc',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', '$$recipientIds'],
              },
            },
          },
          {
            $lookup: {
              from: 'media',
              localField: 'image',
              foreignField: '_id',
              as: 'image',
            },
          },
          {
            $unwind: {
              path: '$image',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              role: 1,
              image: 1,
            },
          },
        ],
        as: 'bcc',
      },
    },

    {
      $project: {
        _id: 1,
        from: 1,
        to: 1,
        cc: 1,
        bcc: 1,
        subject: 1,
        body: 1,
        createdAt: 1,
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  if (record.length === 0) {
    return ApiResponse.success(res, {
      message: 'There are no mails sent by you',
      data: [],
      statusCode: 200,
    });
  }

  const normalized = normalizeDoc(record);
  const parsed = z.array(OutBoxMailSchema).parse(normalized);

  return ApiResponse.success(res, {
    message: 'The mails sent by you are',
    data: parsed,
    statusCode: 200,
  });
};
