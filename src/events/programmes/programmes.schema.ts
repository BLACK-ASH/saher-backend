//import * as createDOMPurify from 'dompurify';
import { Types } from 'mongoose';
import { z } from 'zod';

//const DOMPurify = createDOMPurify.default || createDOMPurify;
const objectId = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

//Base programme schema
export const baseProgrammeSchema = z.object({
  title: z.string().min(5).max(50),

  description: z.string().min(10).max(500),
  //.transform((value) => DOMPurify.sanitize(value)),

  workshops: z.array(objectId).optional(),
});
//Create a programme
export const createProgrammeSchema = baseProgrammeSchema;

//Update a programme
export const updatedProgrammeSchema = baseProgrammeSchema.omit({ workshops: true }).partial();

export type CreateProgrammeInputType = z.infer<typeof createProgrammeSchema>;
export type UpdateProgrammeInputType = z.infer<typeof updatedProgrammeSchema>;
