import { z } from "zod";
import { Types } from "mongoose";
import { objectId } from "../session/session.schema.js";

export const createParticipantSchema = z.object({
  workshopId: objectId,
  name: z.string().min(5).max(30),
  age: z.string().min(1).max(3),
  gender: z.string().min(5).max(20),
})
  .strict();

export const updatedParticipantSchema = z.object({
  name: z.string().min(5).max(30).optional(),
  age: z.string().min(1).max(3).optional(),
  gender: z.string().min(5).max(20).optional(),
})
  .strict();

export type CreateParticipantInputType = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInputType = z.infer<typeof updatedParticipantSchema>;
