import { Types } from 'mongoose';
import { z } from 'zod';

import DOMPurify from '../../libs/dompurify/dompurify.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

//Base workshop schema
export const baseWorkshopSchema = z.object({
  title: z.string().min(5).max(50),
  description: z
    .string()
    .min(10)
    .max(500)
    .transform((value) => DOMPurify.sanitize(value)),

  programmeId: objectId(),
  participants: z.array(objectId()).optional(),
});

//Create a workshop
export const createWorkshopSchema = baseWorkshopSchema;

//Update a workshop
export const updatedWorkshopSchema = baseWorkshopSchema.omit({ participants: true }).partial();

export const createWorkshopResponseSchema = baseWorkshopSchema;
export const updateWorkshopResponseSchema = baseWorkshopSchema;

export type CreateWorkshopInputType = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInputType = z.infer<typeof updatedWorkshopSchema>;
