import { Types } from "mongoose"
import { z } from "zod"
import { objectId } from "../session/session.schema.js"

export const bulkSessionAttendanceSchema = z.object({
  participantIds: z.array(objectId).min(1),
}).strict();

export const getSessionAttendanceSchema = z.object({
    sessionId: objectId,
  }).strict();

export type BulkSessionAttendanceInputType = z.infer<typeof bulkSessionAttendanceSchema>;
export type getSessionAttendanceInputType = z.infer<typeof getSessionAttendanceSchema>;