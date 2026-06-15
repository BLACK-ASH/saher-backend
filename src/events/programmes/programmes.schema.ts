import DOMPurify from 'dompurify';
import { z } from 'zod';

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
  workshops: z.array(objectId()).optional(),
});

//Request Schema
export const createProgrammeSchema = baseProgrammeSchema;
export const updatedProgrammeSchema = baseProgrammeSchema.omit({ workshops: true }).partial();

//Response Schema
export const programmeResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  participants: z
    .array(
      z.object({
        id: z.string(),
      }),
    )
    .optional(),
  workshops: z
    .array(
      z.object({
        id: z.string(),
      }),
    )
    .optional(),
});

export const getProgrammesSchema = z.array(programmeResponseSchema);
export const getSingleProgrammeSchema = programmeResponseSchema;

export const createProgrammeParticipantsResponseSchema = baseProgrammeSchema
  .pick({ participants: true })
  .required();

//Types
export type CreateProgrammeInputType = z.infer<typeof createProgrammeSchema>;
export type UpdateProgrammeInputType = z.infer<typeof updatedProgrammeSchema>;
