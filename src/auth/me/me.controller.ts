import { Request, Response } from "express";
import { User } from "../../database/user.model.js";

export const getUser = async (id: string) => {
  const user = User.findById(id).populate("image", "src alt").select("-password -__v -updatedAt").lean()
  return user
}

export const meController = async (req: Request, res: Response) => {
  const id = req.user?.id

  const user = await getUser(id!)
  return res.status(200).json({ success: true, message: "User details", data: user })
}
