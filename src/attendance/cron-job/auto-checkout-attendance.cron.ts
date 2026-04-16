import { Request, Response } from 'express';
import { ApiError } from '../../libs/class/api-error.js';
import { Attendance } from '../../database/attendance.model.js';
import { timeDifference } from '../../libs/utils/time-difference.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const autoCheckoutCron = async (req: Request, res: Response) => {
  const pass = req.params?.pass;

  // 🔐 Basic protection (use ENV in production)
  if (pass !== 'super') {
    throw new ApiError(403, 'Forbidden. You are not allowed to perform this action.');
  }

  // 📅 Today (same format you are using)
  const today = standardDateString(new Date());

  // 🕕 Default checkout time (6 PM IST)
  const defaultOutTime = new Date();
  defaultOutTime.setHours(18, 0, 0, 0);

  // 🔍 Find users who checked in but not checked out
  const records = await Attendance.find({
    date: today,
    inTime: { $ne: null },
    outTime: null,
  }).lean();

  if (!records.length) {
    return res.status(200).json({
      success: true,
      message: 'No pending auto checkouts.',
      data: { updated: 0 },
    });
  }

  // ⚡ Prepare bulk updates
  const bulkOps = records.map((record) => {
    const inTime = new Date(record.inTime as Date);

    // ⏱ Calculate work hours
    const workHours = timeDifference(defaultOutTime, inTime).hours;

    // 📊 Decide status
    const status = workHours < 5 ? 'half-day' : 'present';

    return {
      updateOne: {
        filter: { _id: record._id },
        update: {
          $set: {
            outTime: defaultOutTime,
            workHours,
            status,
            autoCheckout: true, // 👈 important flag
          },
        },
      },
    };
  });

  // 🚀 Execute bulk update
  await Attendance.bulkWrite(bulkOps);

  return res.status(200).json({
    success: true,
    message: 'Auto checkout completed successfully.',
    data: {
      updated: bulkOps.length,
    },
  });
};
