//import DOMPurify from 'dompurify';
import { Types } from 'mongoose';
import { z } from 'zod';

const objectId = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

//Base workshop schema
export const baseWorkshopSchema = z.object({
  title: z.string().min(5).max(50),

  description: z.string().min(10).max(500),
  // .transform((value) => DOMPurify.sanitize(value)),

  programmeId: objectId,
  participants: z.array(objectId).optional(),
});

//Create a workshop
export const createWorkshopSchema = baseWorkshopSchema;

//Update a workshop
export const updatedWorkshopSchema = baseWorkshopSchema.omit({ participants: true }).partial();

export type CreateWorkshopInputType = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInputType = z.infer<typeof updatedWorkshopSchema>;
