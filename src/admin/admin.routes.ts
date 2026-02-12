import { Router, Request, Response } from "express";
import { createBankDetailController, deleteBankDetailController, getBankDetailController, updateBankDetailController } from "./bank/bank.controller.js";
import { validateBankRegisterSchema, validateBankUpdateSchema } from "./bank/bank.middleware.js";
import { validateAccountRegister } from "./account/account.middleware.js";
import { accountRegisterController } from "./account/account.controller.js";

const adminRouter = Router()

adminRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is A adminRouter Page" })
})

// Bank Details Routes
adminRouter.post("/bank/register", validateBankRegisterSchema, createBankDetailController)
  .get("/bank/get/:id", getBankDetailController)
  .put("/bank/update/:id", validateBankUpdateSchema, updateBankDetailController)
  .delete("/bank/delete/:id", deleteBankDetailController)

adminRouter.post("/account/register", validateAccountRegister, accountRegisterController)


export default adminRouter
