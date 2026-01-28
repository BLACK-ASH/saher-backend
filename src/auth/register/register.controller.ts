import { Request, Response } from "express";
import { RegisterInputType } from "./register.middleware.js";
import { User } from "../../database/user.model.js";
import { Account } from "../../database/account.model.js";

export const registerController = async (req: Request, res: Response) => {
  const registerInput: RegisterInputType = req.body;

  try {
    const existingUser = await User.findOne({ email: registerInput.email });
    if (existingUser) {
      return res.status(400).json({ message: "User With Email already exists" });
    }

    // 1. Create User
    const user = await User.create({
      name: registerInput.name,
      displayName: registerInput.displayName,
      email: registerInput.email,
      role: registerInput.role,
      image: registerInput.image
    });

    // 2. Create Account (IMPORTANT)
    const account = await Account.create({
      user: user._id,
      password: registerInput.password,
      employeeId: registerInput.employeeId,
      gender: registerInput.gender,
      dateOfBirth: registerInput.dateOfBirth,
      phoneNumber: registerInput.phoneNumber,
      secondaryPhoneNumber: registerInput.secondaryPhoneNumber,
      department: registerInput.department,
      designation: registerInput.designation,
      dateOfJoining: registerInput.dateOfJoining,
      employeeType: registerInput.employeeType,
      salaryStructure: registerInput.salaryStructure,
      address: registerInput.address,
      bankDetail: registerInput.bankDetail,
      aadhar: registerInput.aadhar,
      pan: registerInput.pan,
      resume: registerInput.resume,
    });


    return res.status(201).json({
      success: true, message: "Employee registered successfully",data:user._id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Registration failed", data: null });
  }
};

