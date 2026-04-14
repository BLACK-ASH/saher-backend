import { request, Request, Response } from "express"
import { AttendanceCorrection } from "../../database/attendance-correction.model.js"
import { ApiError } from "../../libs/class/api-error.js"
import { Attendance } from "../../database/attendance.model.js"
import { AttendanceCorrectionInputType, AttendanceCorrectionUpdateInputType, attendanceRecordSchema } from "./correction.schema.js"
import { timeDifference } from "../../libs/utils/time-difference.js"
import { convertToObjectId } from "../../libs/utils/convert-objectId.js"
import mongoose from "mongoose"
import { removeUndefined } from "../../libs/utils/remove-undefined-value.js"


export const getAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user

  const requests = await AttendanceCorrection.find({ user: user?.id })
    .populate("user", "name role")
    .populate("attendance", "date")
    .populate("proof", "src alt")
    .lean()

  return res.status(200).json({ success: true, message: "Attendance Correction Retrieve Successful.", data: requests })
}

export const getAttendanceCorrectionById = async (req: Request, res: Response) => {
  const id = req.params.id
  const request = await AttendanceCorrection.findById(id).populate("user manager", "name role").lean()
  if (!request) throw new ApiError(404, "Attendance Correction Request Not Found.")
  return res.status(200).json({ success: true, message: "Attendance Correction Retrieve Successful.", data: request })
}

export const getAllAttendanceCorrectionController = async (req: Request, res: Response) => {
  const requests = await AttendanceCorrection.find()
    .populate("user manager", "name role")
    .populate("attendance", "date")
    .populate("proof")
    .lean()

  return res.status(200).json({ success: true, message: "Attendance Correction Retrieve Successful.", data: requests })
}

export const createAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user;
  const input: AttendanceCorrectionInputType = req.body;

  if (!user?.id) {
    throw new ApiError(401, "User not authenticated.");
  }

  // Check attendance exists
  const attendance = await Attendance.findById(input.attendanceId).lean();
  if (!attendance) {
    throw new ApiError(404, "User Attendance Not Found.");
  }

  // Check existing pending request
  const exist = await AttendanceCorrection.findOne({
    attendance: input.attendanceId,
    status: "pending",
  });

  if (exist) {
    throw new ApiError(400, "A Request Already Exists Of This Date.");
  }

  // Parse previous (DB data)
  const previous = attendanceRecordSchema.parse(attendance);

  // Parse changes (input)
  const changesParsed = attendanceRecordSchema.safeParse({
    inTime: input.inTime,
    outTime: input.outTime,
    status: input.status,
    isLate: input.isLate,
  });

  if (!changesParsed.success) {
    throw new ApiError(400, changesParsed.error.message);
  }

  // Create request
  const request = await AttendanceCorrection.create({
    attendance: input.attendanceId,
    user: convertToObjectId(user.id),
    previous,
    changes: changesParsed.data,
    message: input.message,
    proof: input?.proof,
  });

  return res.status(201).json({
    success: true,
    message: "Attendance Correction Request Successful.",
    data: request,
  });
};

export const updateAttendanceCorrectionController = async (req: Request, res: Response) => {
  const input: AttendanceCorrectionUpdateInputType = req.body;
  const user = req.user;

  if (!user?.id) {
    throw new ApiError(401, "User not authenticated.");
  }

  const parsed = attendanceRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input data.");
  }

  const session = await mongoose.startSession();

  try {
    let updatedRequest;

    await session.withTransaction(async () => {
      const request = await AttendanceCorrection.findById(input.id).session(session);
      if (!request) {
        throw new ApiError(404, "Attendance Correction Request Not Found.");
      }

      const attendance = await Attendance.findById(request.attendance).session(session);
      if (!attendance) {
        throw new ApiError(404, "Attendance Record Not Found.");
      }

      // ✅ calculate work hours safely
      const workHours =
        attendance.inTime && attendance.outTime
          ? timeDifference(attendance.inTime, attendance.outTime).hours
          : null;

      if (workHours === null) {
        throw new ApiError(400, "Work Hours Is Not Valid.");
      }

      const status =
        workHours === 0 ? "absent" : workHours > 5 ? "present" : "half-day";

      // ✅ remove undefined fields
      const filteredChanges = removeUndefined(parsed.data)

      const newRecord = {
        ...filteredChanges,
        status,
        workHours,
      };

      // ✅ update request
      request.manager = convertToObjectId(user.id);
      request.status = input["request-status"];
      request.reason = input.reason;

      await request.save({ session });

      // ✅ update attendance
      await Attendance.findByIdAndUpdate(
        request.attendance,
        { $set: newRecord },
        { session }
      );

      updatedRequest = request;
    });

    return res.status(200).json({
      success: true,
      message: "Attendance Correction Updated Successfully.",
      data: updatedRequest,
    });

  } finally {
    await session.endSession(); // ✅ always cleanup
  }
};
