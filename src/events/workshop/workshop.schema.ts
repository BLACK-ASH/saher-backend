import { z } from "zod";
import { Types } from "mongoose";

//Base workshop schema
export const baseWorkshopSchema = z
  .object({
    title: z.string().min(5).max(50),
    description: z.string().min(10).max(500),
  })
  .strict();

//Create a workshop
export const createWorkshopSchema = baseWorkshopSchema;

//Update a workshop
export const updatedWorkshopSchema = baseWorkshopSchema.partial().strict();

export type CreateWorkshopInputType = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInputType = z.infer<typeof updatedWorkshopSchema>;
