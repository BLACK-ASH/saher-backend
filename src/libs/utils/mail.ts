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
    _id: { $in: allRecipients },
  });

  if (usersFound !== allRecipients.length) {
    throw new ApiError(404, 'Some recipients were not found');
  }

  const mails = [];

  if (data.to.length > 0) {
    mails.push({
      from: data.senderId,
      to: data.to,
      recipientType: 'TO',
      subject: data.subject,
      body: data.body,
    });
  }

  if (data.cc.length > 0) {
    mails.push({
      from: data.senderId,
      to: data.cc,
      recipientType: 'CC',
      subject: data.subject,
      body: data.body,
    });
  }

  if (data.bcc.length > 0) {
    mails.push({
      from: data.senderId,
      to: data.bcc,
      recipientType: 'BCC',
      subject: data.subject,
      body: data.body,
    });
  }

  return Mail.insertMany(mails);
};
export const getMailsByRecipientType = async (
  userId: string,
  recipientType: 'TO' | 'CC' | 'BCC',
) => {
  return Mail.aggregate([
    {
      $match: {
        to: {
          $in: [new mongoose.Types.ObjectId(userId)],
        },
        recipientType,
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
  ]);
};
