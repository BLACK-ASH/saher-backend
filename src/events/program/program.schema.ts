import { z } from 'zod';

import { DOMPurify } from '../../libs/utils/dompurify.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

//Base program schema
export const baseProgramSchema = z.object({
  title: z.string().min(1),
  description: z
    .string()
    .min(1)
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

//Request Schema for adding participants to a program
export const addParticipantsToProgramSchema = z.object({
  participantIds: z
    .array(objectId('Invalid Participant ID'))
    .min(1, 'At least one participant ID is required.'),
});

//Types
export type CreateProgramInputType = z.infer<typeof createProgramSchema>;
export type UpdateProgramInputType = z.infer<typeof updatedProgramSchema>;
