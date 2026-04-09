import { z } from "zod";
import { Types } from "mongoose";

const dateField = z
  .union([z.string().datetime(), z.date()])
  .transform((val) => new Date(val));

  export const baseWorkshopSchema = z.object({
    title: z.string().min(5).max(50),
    description: z.string().min(10).max(500),
    startDate: dateField,
    endDate: dateField,
    createdBy: z.string().min(5).max(50),
  })
  .strict();


  export const createWorkshopSchema = baseWorkshopSchema.refine((data) => data.endDate > data.startDate, {
      message: "end date must be after start date",
      path: ["endDate"],
  })

export const updatedWorkshopSchema =
    baseWorkshopSchema.partial().refine((data) => {
        if (data.startDate && data.endDate) {
            return data.endDate > data.startDate;
        }
        return true;
    }, {
        message: "end date must be after start date",
        path: ["endDate"]
    })
        .strict();

export type CreateWorkshopInputType = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInputType = z.infer<typeof updatedWorkshopSchema>;
