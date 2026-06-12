import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import z from 'zod';

import { InBoxMailSchema, OutBoxMailSchema, sendMailSchema } from './mail.schema.js';
import { Mail } from '../database/mail.model.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { getMailsByRecipientType, sendMail } from '../libs/utils/mail.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';


export const getInboxController = async (req: Request, res: Response) => {
  const userId = req.user!.id.toString();

  const [toMails, ccMails, bccMails] = await Promise.all([
    getMailsByRecipientType(userId, 'TO'),
    getMailsByRecipientType(userId, 'CC'),
    getMailsByRecipientType(userId, 'BCC'),
  ]);

  const inbox = [...toMails, ...ccMails, ...bccMails].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (inbox.length === 0) {
    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'There are no mails for you',
      data: [],
    });
  }

  const normalized = normalizeDoc(inbox);

  const parsed = z.array(InBoxMailSchema).parse(normalized);

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'Inbox fetched successfully',
    data: parsed,
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
      $project: {
        _id: 1,
        from: 1,
        to: 1,
        recipientType: 1,
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
