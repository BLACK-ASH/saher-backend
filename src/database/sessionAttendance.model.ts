import mongoose, { Schema } from "mongoose";

const sessionAttendanceSchema = new mongoose.Schema(
    {
        sessionId: {
            type: Schema.Types.ObjectId,
            ref: "Session",
            required: true,
        },
        participantId: {
            type: Schema.Types.ObjectId,
            ref: "Participant",
            required: true,
        }
    }   
)

sessionAttendanceSchema.index({ sessionId: 1, participantId: 1 }, { unique: true });

export type sessionAttendanceType = mongoose.InferSchemaType<typeof sessionAttendanceSchema>;

export const SessionAttendance = mongoose.model<sessionAttendanceType>("SessionAttendance", sessionAttendanceSchema) 