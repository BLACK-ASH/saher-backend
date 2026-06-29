import mongoose from 'mongoose';
import { z } from 'zod';

import { Mail } from '../../database/mail.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';

export const sendMailUtilitySchema = z
  .object({
    senderId: z.string(),
    to: z.array(z.string()).min(1),
    cc: z.array(z.string()).default([]),
    bcc: z.array(z.string()).default([]),
    subject: z.string().trim().min(1, 'Subject is required').max(255),
    body: z.string().trim().min(1, 'Body is required'),
  })
  .superRefine((data, ctx) => {
    const recipients = [...data.to, ...data.cc, ...data.bcc];

    if (recipients.includes(data.senderId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You cannot send mail to yourself',
        path: ['senderId'],
      });
    }
  });

type SendMailPayload = z.infer<typeof sendMailUtilitySchema>;

export const sendMail = async (payload: SendMailPayload) => {
  const data = sendMailUtilitySchema.parse(payload);

  const allRecipients = [...new Set([...data.to, ...data.cc, ...data.bcc])];

  const usersFound = await User.countDocuments({
    _id: {
      $in: allRecipients,
    },
  });

  if (usersFound !== allRecipients.length) {
    throw new ApiError(404, 'Some recipients were not found');
  }

  return Mail.create({
    from: data.senderId,
    to: data.to,
    cc: data.cc,
    bcc: data.bcc,
    subject: data.subject,
    body: data.body,
  });
};

export const getInboxMails = async (userId: string) => {
  return Mail.aggregate([
    {
      $match: {
        $or: [
          {
            to: new mongoose.Types.ObjectId(userId),
          },
          {
            cc: new mongoose.Types.ObjectId(userId),
          },
          {
            bcc: new mongoose.Types.ObjectId(userId),
          },
        ],
      },
    },
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
            $unwind: '$image',
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
    {
      $lookup: {
        from: 'users',
        let: {
          ids: '$to',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', '$$ids'],
              },
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              role: 1,
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
          ids: '$cc',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', '$$ids'],
              },
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              role: 1,
            },
          },
        ],
        as: 'cc',
      },
    },
    {
      $addFields: {
        isBccRecipient: {
          $in: [new mongoose.Types.ObjectId(userId), '$bcc'],
        },
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 1,
        from: 1,
        to: 1,
        cc: 1,
        subject: 1,
        body: 1,
        createdAt: 1,
        isBccRecipient: 1,
      },
    },
  ]);
};
