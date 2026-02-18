import { Request, Response } from "express";
import { User } from "../../database/user.model.js";

export const userGetController = async (req: Request, res: Response) => {
  const id = req.params.id

  try {
    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: "User get successfully.",
      data: user
    });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Get failed.",
      data: error
    });
  }
}

export const userUpdateController = async (req: Request, res: Response) => {
  const id = req.params.id
  const updateInput = req.body

  try {
    const update = await User.findByIdAndUpdate(id,updateInput)

    if (!update) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: "User update successfully.",
      data: null
    });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Update failed.",
      data: error
    });
  }
}
export const userDeleteController = async (req: Request, res: Response) => {
  const id = req.params.id
  const deleteData = {
    isActive:false,
    deletedAt : new Date()
  }

  try {
    const deleted = await User.findByIdAndUpdate(id,deleteData)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      data: null
    });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "delete failed.",
      data: error
    });
  }
}
