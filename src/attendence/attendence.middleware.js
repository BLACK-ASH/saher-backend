// import { Request, Response, NextFunction } from "express"
// import jwt from "jsonwebtoken"

import jwt from "jsonwebtoken"

export const verifyToken = (req, res, next) => {
    const token = req.cookies?.saher_access_token

    if (!token) {
        return res.status(401).json({
            message: "Unauthorize User",
            success: false
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET )
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or token expired ",
            success: false
        })
    }
}