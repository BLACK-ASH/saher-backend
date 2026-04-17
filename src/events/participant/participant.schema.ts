import { z } from "zod";

export const participantSchema = z.object({
  name: z.string().min(4).max(30),
  age: z.coerce.number().min(1).max(100),
  gender: z.string().min(3).max(20),
  phoneNumber: z.string().length(10),
  photo: z.string(),
  address: z.string().min(20).max(50),
  affiliation: z.string().min(20).max(50),
  parentDetails: z.string(),
  document: z.string(),
})
.refine((data) => {
  return data.age >= 18 || !!data.parentDetails;
}, {
  message: "parentDetails is required if age < 18",
  path: ["parentDetails"],
});

export const updatedParticipantSchema =  participantSchema.partial()

export type CreateParticipantInputType = z.infer<typeof participantSchema>;
export type UpdateParticipantInputType = z.infer<typeof updatedParticipantSchema>;
