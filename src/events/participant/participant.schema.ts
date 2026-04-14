import { z } from "zod";

export const participantSchema = z.object({
  name: z.string().min(4).max(30),
  age: z.string().min(1).max(120),
  gender: z.string().min(3).max(20),
});

export const updatedParticipantSchema =  participantSchema.partial()

export type CreateParticipantInputType = z.infer<typeof participantSchema>;
export type UpdateParticipantInputType = z.infer<typeof updatedParticipantSchema>;
