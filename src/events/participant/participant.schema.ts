import { z } from 'zod';

import { imageType, objectId } from '../../libs/utils/zod-object-id.js';

export const baseSchema = z.object({
  name: z.string().min(2),
  age: z.coerce.number().min(1).optional(),
  gender: z
    .string()
    .transform((e) => e.toLocaleUpperCase())
    .optional(),
  phoneNumber: z.string().optional(),
  image: objectId().optional(),
  address: z.string().optional(),
  affiliation: z.string().optional(),
  parentDetails: z.string().optional(),
  document: z.array(objectId()).optional(),
});

export const participantSchema = baseSchema.refine(
  (data) => {
    if (data.age) return data.age >= 18 || !!data.parentDetails;
  },
  {
    message: 'Parent Details is required if age is less than 18',
    path: ['parentDetails'],
  },
);

export const updatedParticipantSchema = baseSchema.partial();
export const participantResponseSchema = baseSchema
  .omit({ image: true, document: true })
  .extend({ id: z.string(), image: imageType.optional(), document: imageType.array().optional() });

export type CreateParticipantInputType = z.infer<typeof participantSchema>;
export type UpdateParticipantInputType = z.infer<typeof updatedParticipantSchema>;
