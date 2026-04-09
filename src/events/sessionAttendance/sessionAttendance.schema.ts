import { Types } from "mongoose"
import { z } from "zod"
import { objectId } from "../session/session.schema.js"

export const bulkSessionAttendanceSchema = z.object({
    participantIds: z.array(objectId).min(1)
}).strict();

export type bulkSessionAttendanceInputType = z.infer<typeof bulkSessionAttendanceSchema>