import { NextFunction, Request, Response } from "express";
import { generateToken, ReqUser, verifyAccessToken, verifyRefreshToken } from "../utils/jwt-token.js";

export const protectedRoute = async (req: Request, res: Response, next: NextFunction) => {

  try {

    const access = req.cookies?.saher_access_token
    const refresh = req.cookies?.saher_refresh_token

    if (!access && !refresh) {
      return res.status(401).json({ success: false, message: "Login Required." })
    }

    if (!access && refresh) {
      const verifyToken = verifyRefreshToken(refresh)

      if (!verifyToken) {
        return res.status(401).json({ success: false, message: "Login Required." })
      }

      const user: ReqUser = {
        id: verifyToken.id,
        name: verifyToken.name,
        role: verifyToken.role,
        employeeType: verifyToken.employeeType
      }

      const { accessToken, refreshToken } = generateToken(user)

      req.user = user
      res.cookie("saher_access_token", accessToken, { maxAge: 604800000, httpOnly: true, secure: true, sameSite: "none" })
      res.cookie("saher_refresh_token", refreshToken, { maxAge: 7776000000, httpOnly: true, secure: true, sameSite: "none" })
      return next()
    }

    const verifyToken = verifyAccessToken(access)

    if (!verifyToken) {
      return res.status(401).json({ success: false, message: "Login Required." })
    }

    const user: ReqUser = {
      id: verifyToken.id,
      name: verifyToken.name,
      role: verifyToken.role,
      employeeType: verifyToken.employeeType
    }

    if (!verifyToken) {
      return res.status(401).json({ success: false, message: "Login Required." })
    }

    req.user = user
    return next()

  } catch (error) {
    console.error(error);
    res.clearCookie("saher_access_token")
    res.clearCookie("saher_refresh_token")
    return res.status(401).json({ success: false, message: "Invalid Token.", data: error })
  }
}
