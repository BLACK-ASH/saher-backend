import { z } from 'zod';

import { DOMPurify } from '../../libs/utils/dompurify.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

//Base programme schema
export const baseProgrammeSchema = z.object({
  title: z.string().min(5).max(50),
  description: z
    .string()
    .min(10)
    .max(500)
    .transform((value) => DOMPurify.sanitize(value)),
  participants: z.array(objectId()).optional(),
});

//Request Schema
export const createProgrammeSchema = baseProgrammeSchema;
export const updatedProgrammeSchema = baseProgrammeSchema.partial();

//Response Schema
export const programmeResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export const getProgrammesSchema = z.array(programmeResponseSchema);
export const getSingleProgrammeSchema = programmeResponseSchema;

export const createProgrammeParticipantsResponseSchema = baseProgrammeSchema
  .pick({ participants: true })
  .required();

//Types
export type CreateProgrammeInputType = z.infer<typeof createProgrammeSchema>;
export type UpdateProgrammeInputType = z.infer<typeof updatedProgrammeSchema>;
