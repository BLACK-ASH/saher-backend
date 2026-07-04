import { z } from 'zod';

import { DOMPurify } from '../../libs/utils/dompurify.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

//Base program schema
export const baseProgramSchema = z.object({
  title: z.string().min(2).max(50),
  description: z
    .string()
    .min(2)
    .transform((value) => DOMPurify.sanitize(value)),
  participants: z.array(objectId()).optional(),
});

//Request Schema
export const createProgramSchema = baseProgramSchema;
export const updatedProgramSchema = baseProgramSchema.partial();

//Response Schema
export const programResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export const createProgramParticipantsResponseSchema = baseProgramSchema
  .pick({ participants: true })
  .required();

//Types
export type CreateProgramInputType = z.infer<typeof createProgramSchema>;
export type UpdateProgramInputType = z.infer<typeof updatedProgramSchema>;
