import { Request, Response } from "express";
import { BankDetail } from "../../database/bankDetail.model.js";

export const createBankDetailController = async (req: Request, res: Response) => {
  const { accountHolderName, bankName, ifcs, branch, mobileNumber } = req.body

  // If Data Is Not Provided

  if(!accountHolderName || !accountHolderName.trim()){
    return res.status(400).json({message:"No Account Holder Name Provided"})
  }

  if(!bankName || !bankName.trim()){
    return res.status(400).json({message:"No Bank Name Provided"})
  }

  if(!ifcs || !ifcs.trim()){
    return res.status(400).json({message:"No IFCS Code Provided"})
  }

  if(!branch || !branch.trim()){
    return res.status(400).json({message:"No Branch Name Provided"})
  }

  if(!mobileNumber || !mobileNumber.trim()){
    return res.status(400).json({message:"No Mobile Number Provided"})
  }

  try {
    const details = await BankDetail.create({ accountHolderName, bankName, ifcs, branch, mobileNumber })
    return res.status(201).json({ message: "Bank Details Added Succesfull", data: details })
  }
  catch (err) {
    return res.status(400).json({ message: "Failed To Add Bank Details", data: err })
  }
}
