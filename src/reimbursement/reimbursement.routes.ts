import { Router } from "express";
import { createReimbursement, getAllReimbursements, getMyReimbursements, reviewReimbursement } from "./reimbursement.controller.js";
import { authorize } from "../permission/authorize.js";

export const reimbursementRouter = Router() 


reimbursementRouter.get("/",getMyReimbursements)
reimbursementRouter.get("/all",getAllReimbursements)
reimbursementRouter.post("/create",authorize("write","reimbursement"),createReimbursement)
reimbursementRouter.put("/review" , authorize("update","reimbursement"),  reviewReimbursement)