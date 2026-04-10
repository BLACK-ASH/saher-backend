import { Types } from "mongoose"
import z, { date } from "zod"


export const objectId = z.string().refine(val =>
    Types.ObjectId.isValid(val), {
    message: "Invalid ID"
})

const dateField = z.union([z.string().datetime(), z.date()])
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), {
        message: "Invalid date",
    })

export const baseSchema = z.object({
    workshopID: objectId,
    title: z.string().min(3),
    description: z.string().min(5).max(500),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    startTime: z.string().regex(/\d{2}:\d{2}$/, "SatrtTime must be in HH:MM format"),
    endTime: z.string().regex(/\d{2}:\d{2}$/, "EndTime must be in HH:MM format"),
    speaker: z.string().min(3)
})

export const createSessionSchema = baseSchema

export const updatedSessionSchema = baseSchema.partial().strict();

export type CreateSessionInputType = z.infer<typeof createSessionSchema>;

export type UpdatedSessionInputType = z.infer<typeof updatedSessionSchema>;