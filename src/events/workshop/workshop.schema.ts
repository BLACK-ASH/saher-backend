import { z } from "zod";
import { Types } from "mongoose";

const dateField = z
  .union([z.string().datetime(), z.date()])
  .transform((val) => new Date(val));

export const createWorkshopSchema = z.object({
    title: z.string().min(5).max(50),
    description: z.string().min(10).max(500),
    startDate: dateField,
    endDate: dateField,
    createdBy: z.string().min(5).max(50),
  })
  .strict();

export const updatedWorkshopSchema = z.object({
    title: z.string().min(5).max(50).optional(),
    description: z.string().min(10).max(500).optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
    createdBy: z.string().min(5).max(50).optional(),
  })
  .strict();

export type CreateWorkshopInputType = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInputType = z.infer<typeof updatedWorkshopSchema>;
