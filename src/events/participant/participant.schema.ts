import { z } from 'zod';

import {
  imageType,
  objectId,
  optionalAlphaText,
  optionalField,
  optionalText,
} from '../../libs/utils/zod-object-id.js';

export const baseSchema = z.object({
  name: z
    .string()
    .min(2)
    .regex(/^[A-Za-z\s]+$/, 'Name must contain only letters'),

  age: z.coerce.number().min(1).optional(),

  gender: optionalAlphaText(),

  phoneNumber: optionalField(
    z
      .string()
      .trim()
      .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
        message: 'Invalid Indian Mobile Number',
      }),
  ),

  image: objectId().optional(),

  address: optionalText(),

  affiliation: optionalText(),

  parentDetails: optionalText(),

  document: z.array(objectId()).optional(),
});

export const participantSchema = baseSchema
  .transform((val) => {
    {
      val.phoneNumber = val.phoneNumber?.toString().replace(/^\+91[\s-]?|^91[\s-]?/, '');
    }
    return val;
  })
  .refine(
    (data) => {
      if (data.age === undefined) return true;

      return data.age >= 18 || !!data.parentDetails;
    },
    {
      message: 'Parent Details is required if age is less than 18',
      path: ['parentDetails'],
    },
  );

export const updatedParticipantSchema = baseSchema.partial();
export const participantResponseSchema = baseSchema
  .omit({ phoneNumber: true, image: true, document: true })
  .extend({
    id: z.string(),
    phoneNumber: z.string().optional(),
    image: imageType.nullable().optional(),
    document: imageType.array().optional(),
  });

export type CreateParticipantInputType = z.infer<typeof participantSchema>;
export type UpdateParticipantInputType = z.infer<typeof updatedParticipantSchema>;
