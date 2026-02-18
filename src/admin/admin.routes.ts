import { Router, Request, Response } from "express";
import { createBankDetailController, deleteBankDetailController, getBankDetailController, updateBankDetailController } from "./bank/bank.controller.js";
import { validateBankRegisterSchema, validateBankUpdateSchema } from "./bank/bank.middleware.js";
import { validateAccountRegister, validateAccountUpdate } from "./account/account.middleware.js";
import { accountGetController, accountRegisterController, accountUpdateController } from "./account/account.controller.js";
import { userDeleteController, userGetController, userUpdateController } from "./user/user.controller.js";
import { validateUserUpdate } from "./user/user.middleware.js";

const adminRouter = Router()

adminRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is A adminRouter Page" })
})

// Bank Routes
adminRouter.post("/bank/register", validateBankRegisterSchema, createBankDetailController)
  .get("/bank/get/:id", getBankDetailController)
  .put("/bank/update/:id", validateBankUpdateSchema, updateBankDetailController)
  .delete("/bank/delete/:id", deleteBankDetailController)

// Account Routes
adminRouter.post("/account/register", validateAccountRegister, accountRegisterController)
  .put("/account/update/:id", validateAccountUpdate, accountUpdateController)
  .get("/account/get/:id", accountGetController)

// User Routes
adminRouter.get("/user/get/:id", userGetController)
  .put("/user/update/:id", validateUserUpdate, userUpdateController)
  .delete("/user/delete/:id", userDeleteController)

export default adminRouter
