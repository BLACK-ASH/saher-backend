import { Request, Response } from "express"
import { User } from "../../database/user.model.js"
import { comparePassword } from "../../libs/utils/password-hash.js"
import { generateToken } from "../../libs/utils/jwt-token.js"

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const token = {
      accessToken: req.cookies?.saher_access_token,
      refreshToken: req.cookies?.saher_refresh_token
    }

    if (token.accessToken && token.refreshToken) {
      return res.status(200).json({ success: true, message: "Already Login.", data: token })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ success: false, message: "User Not Found.", data: null })
    }

    const matchPassword = await comparePassword(password, user.password!)

    if (!matchPassword) {
      return res.status(403).json({ success: false, message: "Invalid credentials", data: null })
    }

    const { accessToken, refreshToken } = generateToken({ id: user._id.toString(), name: user.name!, role: user.role })

    res.cookie("saher_access_token", accessToken, { maxAge: 604800000, httpOnly: true, secure: true, sameSite: "none" })
    res.cookie("saher_refresh_token", refreshToken, { maxAge: 7776000000, httpOnly: true, secure: true, sameSite: "none" })

    return res.status(200).json({ success: true, message: "login succesfully.", data: { accessToken, refreshToken } })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Internal Server Error", data: error })
  }
}
