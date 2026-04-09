import { Request, Response } from "express";
import { SessionAttendance } from "../../database/sessionAttendance.model.js";
import { string, success } from "zod";
import { ApiError } from "../../libs/class/api-error.js";
import { Session } from "../../database/session.model.js";
import { Participant } from "../../database/participant.model.js";

export const markAttendance = async (req: Request, res: Response) => {

    // storing sessionid and participantIds from req.body (participantId is storing in array for bulk attendance)
    const sessionId = req.params.sessionId as string;
    const { participantIds }: { participantIds: string[]; } = req.body;

    // conditon to check we have both sessionid and participantId if one them is not throw error
    if (!sessionId || !participantIds?.length) throw new ApiError(400, "sessionId and participantIds is required");

    // if the session of the follwing ID not exist throw error 
    const sessionExist = await Session.findById(sessionId);
    if (!sessionExist) throw new ApiError(400, "Session not found");

    // after finding the seesion get valid participants of the same workshop
    const validParticipants = await Participant.find({
        _id: { $in: participantIds },
        workshopId: sessionExist.workshopID,
    }).select("_id");
    if (validParticipants.length === 0) {
        throw new ApiError(400, "No participants found for this workshop");
    }

    // converting object into string
    const validIds = validParticipants.map(p => p._id.toString());

    const inValidIds = participantIds.filter(inId => !validIds.includes(inId))
    if (inValidIds.length > 0) {
        throw new ApiError(
            400,
            `These participants are not part of this workshop: ${inValidIds.join(", ")}`
        );
    }

    // only present participants will be shown
    const filteredIds = participantIds.filter(id => validIds.includes(id));

    // Convert array of IDs → array of database records
    const records = filteredIds.map(participantId => ({ sessionId, participantId }))

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