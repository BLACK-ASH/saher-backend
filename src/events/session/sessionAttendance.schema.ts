import { z } from "zod";
import { objectId } from "./session.schema.js";

//Single attendance
export const markAttendanceSchema = z.object({
  params: z.object({
    sessionId: objectId,
  }),
  body: z.object({
    participantId: objectId,
    status: z.enum(["present", "absent"]).optional(),
  }),
});

//Bulk attendance
export const bulkSessionAttendanceSchema = z.object({
  participantIds: z.array(objectId).min(1),
});

//Get attendance 
export const getSessionAttendanceSchema = z.object({});

export type MarkAttendanceInputType = z.infer<typeof markAttendanceSchema>;
export type BulkSessionAttendanceInputType = z.infer<typeof bulkSessionAttendanceSchema>;
export type GetSessionAttendanceInputType = z.infer<typeof getSessionAttendanceSchema>;