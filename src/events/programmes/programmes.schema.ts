//import * as createDOMPurify from 'dompurify';
import { Types } from 'mongoose';
import { z } from 'zod';

import { objectId } from '../../libs/utils/zod-object-id.js';

//const DOMPurify = createDOMPurify.default || createDOMPurify;

//Base programme schema
export const baseProgrammeSchema = z.object({
  title: z.string().min(5).max(50),

  description: z.string().min(10).max(500),
  //.transform((value) => DOMPurify.sanitize(value)),
  participants: z.array(objectId()).optional(),
  workshops: z.array(objectId()).optional(),
});
//Create a programme
export const createProgrammeSchema = baseProgrammeSchema;

//Update a programme
export const updatedProgrammeSchema = baseProgrammeSchema.omit({ workshops: true }).partial();

export const createProgrammeResponseSchema = baseProgrammeSchema;
export const updateProgrammeResponseSchema = baseProgrammeSchema;

export const createProgrammeParticipantsResponseSchema = baseProgrammeSchema
  .pick({ participants: true })
  .required();

export type CreateProgrammeInputType = z.infer<typeof createProgrammeSchema>;
export type UpdateProgrammeInputType = z.infer<typeof updatedProgrammeSchema>;
