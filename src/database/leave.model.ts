import mongoose from "mongoose";
import { string } from "zod";

const leaveSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
        unique: true,
    },

    leaveType: {
        type: string,
        enum: ["paid", "unpaid", "sick", "other"],
        require: true,
    },

    date: {
        type: Date,
        required: true,
    },

    reason: {
        type: String,
        require: true,
    },
},
    { timestamps: true },
)

export type LeaveType = mongoose.InferSchemaType<typeof leaveSchema>
export const Leave = mongoose.model<LeaveType>("Leave", leaveSchema)