import { NextFunction, Request, Response } from "express";
import z from "zod";
import { Leave } from "../database/leave.model.js";

export const applyLeave = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsedData = Leave.parse(req.body);

        const { user, date, leaveType, reason } = parsedData;

        console.log("Leave Request:");
        console.log("User:", user);
        console.log("Date:", date);
        console.log("Type:", leaveType);
        console.log("Reason:", reason);

        if (new Date(date) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Cannot apply leave for past dates",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Leave applied successfully",
            data: {
                user,
                date,
                leaveType,
                reason,
            },
        });
    } catch (error: any) {
        const customError = new Error(error.message || "Something went wrong");
        (customError as any).statusCode = 400;
        next(customError);
    }
};