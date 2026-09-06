// One-off backfill: recompute workHours + status for existing attendance rows whose
// stored values were computed by buggy/wrong-shift logic (e.g. attendance correction
// previously used the approver's shift instead of the employee's).
// Run: pnpm backfill:attendance
/* eslint-disable no-console */
import mongoose from 'mongoose';

import { Account } from '../src/database/account.model.js';
import { Attendance } from '../src/database/attendance.model.js';
import { env } from '../src/config/env.js';
import { deleteCacheGroup } from '../src/libs/redis/redis-utils.js';
import { calculateWorkStatus, getShift } from '../src/libs/utils/calculate-work-status.js';
import { normalizeDoc } from '../src/libs/utils/normailize-doc.js';
import { accountSchemaFinal } from '../src/admin/_services/account.js';

const run = async () => {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected.');

  const records = await Attendance.find({
    inTime: { $ne: null },
    outTime: { $ne: null },
    status: { $in: ['present', 'half-day', 'absent'] },
  })
    .select('user inTime outTime workHours status overtime')
    .lean();

  console.log(`Found ${records.length} attendance rows to recompute.`);

  const userIds = [...new Set(records.map((r) => r.user.toString()))];
  const accounts = await Account.find({ user: { $in: userIds } })
    .populate('bank aadhar pan resume')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .lean();
  const parsed = accountSchemaFinal.parse(normalizeDoc(accounts));
  const shiftByUser = new Map(parsed.map((acc) => [acc.user.id.toString(), getShift(acc)]));

  const bulkOps = [];
  let skippedOvertime = 0;
  let skippedNoAccount = 0;

  for (const record of records) {
    const userId = record.user.toString();
    const shift = shiftByUser.get(userId);
    if (!shift) {
      skippedNoAccount++;
      continue;
    }

    if (record.overtime === true) {
      skippedOvertime++;
      continue;
    }

    const { workHours, status } = calculateWorkStatus({
      inTime: record.inTime,
      outTime: record.outTime,
      shift,
    });

    bulkOps.push({
      updateOne: {
        filter: { _id: record._id },
        update: { $set: { workHours, status } },
      },
    });
  }

  if (bulkOps.length) {
    for (let i = 0; i < bulkOps.length; i += 1000) {
      await Attendance.bulkWrite(bulkOps.slice(i, i + 1000));
    }
  }

  console.log(
    `Updated ${bulkOps.length} rows (skipped: overtime=${skippedOvertime}, no-account=${skippedNoAccount}).`,
  );

  await deleteCacheGroup('attendance');
  await deleteCacheGroup('today');
  console.log('Cache invalidated.');

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});