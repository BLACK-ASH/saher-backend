import { Router } from "express";
import { createReimbursement, getAllReimbursements, getMyReimbursements, reviewReimbursement } from "./reimbursement.controller.js";
import { authorize } from "../permission/authorize.js";
import { reimbursementReviewSchema, reimbursementSchema } from "./reimbursement.schema.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";

export const reimbursementRouter = Router() 


reimbursementRouter.get("/",getMyReimbursements)
reimbursementRouter.get("/all",getAllReimbursements)
reimbursementRouter.post("/create",authorize("write","reimbursement"),validate(reimbursementSchema),createReimbursement)
reimbursementRouter.put("/review" , authorize("update","reimbursement"),validate(reimbursementReviewSchema),  reviewReimbursement)