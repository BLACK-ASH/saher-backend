import { Request, Response } from "express";

export const registerController = async (req: Request, res: Response) => {
  const { name, dispalyName, email, role } = req.body
  const { gender, dateOfBirth, phoneNumber, secondaryPhoneNumber } = req.body
  const { employeeId, department, designation, dateOfJoining, employeeType, salaryStructure } = req.body
  const { address, bankDetail } = req.body
  const { aadhar, pan, resume } = req.body



  return res.status(201).json({ message: "User Created" })
}
