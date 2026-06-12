//import DOMPurify from 'dompurify';
import { Types } from 'mongoose';
import { z } from 'zod';

import { objectId } from '../../libs/utils/zod-object-id.js';

//Base workshop schema
export const baseWorkshopSchema = z.object({
  title: z.string().min(5).max(50),
  description: z.string().min(10).max(500),
  // .transform((value) => DOMPurify.sanitize(value)),
});

//Request Schema
export const createWorkshopSchema = baseWorkshopSchema;
export const updatedWorkshopSchema = baseWorkshopSchema.partial();

//Response Schema
export const workshopResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  programmeId: z.string(),
});

export const getWorkshopsFromProgrammeResponseSchema = z.array(workshopResponseSchema);
export const getSingleWorkshopSchema = workshopResponseSchema;

//Types
export type CreateWorkshopInputType = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInputType = z.infer<typeof updatedWorkshopSchema>;
