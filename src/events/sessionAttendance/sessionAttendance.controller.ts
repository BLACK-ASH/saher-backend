import { Request, Response } from "express";
import { SessionAttendance } from "../../database/sessionAttendance.model.js";
import { string, success } from "zod";
import { ApiError } from "../../libs/class/api-error.js";

export const markAttendance = async (req: Request, res: Response) => {

    // storing sessionid and participantIds from req.body (participantId is storing in array for bulk attendance)
    const sessionId = req.params.sessionId as string;
    const { participantIds }: { participantIds: string[]; } = req.body;

    // conditon to check we have both sessionid and participantId if one them is not throw error
    if (!sessionId || !participantIds?.length) throw new ApiError(400, "sessionId and participantIds is required");

    const notExist = await SessionAttendance.findById()

    // Convert array of IDs → array of database records
    const records = participantIds.map(participantId => ({ sessionId, participantId }))

    // Inserting the data and preventing duplicate data
    await SessionAttendance.insertMany(records, {
        ordered: false,
    });

    // storing the data of the present participant and populating data
    const present = await SessionAttendance.find({ sessionId }).populate("participantId");
    return res.status(200).json({
        success: true,
        message: "Attendance is marked",
        data: present
    })
}