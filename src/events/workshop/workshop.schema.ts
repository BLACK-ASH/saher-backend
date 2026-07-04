import { z } from 'zod';

import { DOMPurify } from '../../libs/utils/dompurify.js';

//Base workshop schema
export const baseWorkshopSchema = z.object({
  title: z.string().min(5).max(50),
  description: z
    .string()
    .min(4)
    .transform((value) => DOMPurify.sanitize(value)),
  id: z.object,
});

//Request Schema
export const createWorkshopSchema = baseWorkshopSchema;
export const updatedWorkshopSchema = baseWorkshopSchema.partial();

//Response Schema
export const workshopResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  programId: z.string(),
});

//Types
export type CreateWorkshopInputType = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInputType = z.infer<typeof updatedWorkshopSchema>;
