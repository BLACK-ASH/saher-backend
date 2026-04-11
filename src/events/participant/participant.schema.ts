import { z } from "zod";
import { Types } from "mongoose";
import { objectId } from "../session/session.schema.js";

export const createParticipantSchema = z.object({
    workshopId: objectId,
    name: z.string().min(4).max(30),
    age: z.string().min(1).max(120),
    gender: z.string().min(3).max(20),
}).strict();

export const updatedParticipantSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().min(4).max(30).optional(),
    age: z.string().min(1).max(120).optional(),
    gender: z.string().min(3).max(20).optional(),
  }),
}).strict();

export type CreateParticipantInputType = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInputType = z.infer<typeof updatedParticipantSchema>;
