import { z } from 'zod';

import { objectId } from './session.schema.js';

//attendance
export const SessionAttendanceSchema = z.object({
  participantIds: z.array(objectId).min(1),
});

export type BulkSessionAttendanceInputType = z.infer<typeof SessionAttendanceSchema>;
