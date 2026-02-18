import { Request, Response } from "express";
import { AccountRegister } from "./account.middleware.js";
import { User } from "../../database/user.model.js";
import { Account } from "../../database/account.model.js";
import mongoose from "mongoose";

export const accountRegisterController = async (req: Request, res: Response) => {
  const registerInput: AccountRegister = req.body;
  const session = await mongoose.startSession();

  try {
    const existingUser = await User.findOne({ email: registerInput.user.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with email already exists.",
        data: null
      });
    }

    let createdUser;

    await session.withTransaction(async () => {
      // 1. Create User
      const user = await User.create([registerInput.user], { session });
      createdUser = user[0];

      // 2. Create Account
      const account = await Account.create([{
        user: createdUser._id,
        ...registerInput.account
      }], { session });

      if (!account.length) {
        throw new Error("Account creation failed.");
      }
    });

    return res.status(201).json({
      success: true,
      message: "Employee registered successfully.",
      data: createdUser?._id
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      data: error
    });
  } finally {
    await session.endSession();
  }
};

export const accountUpdateController = async (req: Request, res: Response) => {
  const id = req.params.id
  const updateInput = req.body

  try {
    const update = await Account.findByIdAndUpdate(id, updateInput)

    if (!update) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
        data: null
      });

    }

    return res.status(200).json({
      success: true,
      message: "Employee update successfully.",
      data: null
    });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Update failed",
      data: error
    });
  }
}

export const accountGetController = async (req: Request, res: Response) => {
  const id = req.params.id

  try {
    const account = await Account.findById(id)

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
        data: null
      });
    }
    return res.status(200).json({
      success: true,
      message: "Employee get successfully.",
      data: account
    });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Get failed",
      data: error
    });
  }
}
