import { Router } from "express"
import { checkInController } from "./mark/check-in.controller.js"
import { checkOutController } from "./mark/check-out.controller.js"
import { updateHolidayController, getAllHolidayController, getHolidayController, deleteHolidayController, addHolidayController } from "./holiday/holiday.controller.js"
import { authorize } from "../permission/authorize.js"
import { holidaySchema, holidayUpdateSchema } from "./holiday/holiday.schema.js"
import { attendanceCorrectionSchema, attendanceCorrectionUpdateSchema } from "./correction/correction.schema.js"
import { createAttendanceCorrectionController, getAllAttendanceCorrectionController, getAttendanceCorrectionById, getAttendanceCorrectionController, updateAttendanceCorrectionController } from "./correction/correction.controller.js"
import { todayAttendanceController } from "./retrieve/today.controller.js"
import { meAttendanceController } from "./retrieve/me.controller.js"
import { getAllUserController } from "./retrieve/get-present-user.controller.js"
import { retrieveAttendanceController } from "./retrieve/retrieve-attendance.controller.js"
import { createAttendanceCron } from "./cron-job/create-attendance.cron.js"
import { autoCheckoutCron } from "./cron-job/auto-checkout-attendance.cron.js"
import { validate } from "../libs/middleware/validate-zod-schema.js"
import { getAttendanceById } from "./retrieve/get-attendance.controller.js"

const attendanceRouter = Router()

// Attendance Retrieval Route
attendanceRouter.get("/me", meAttendanceController)
attendanceRouter.get("/today", todayAttendanceController)
attendanceRouter.post("/check-in", checkInController)
attendanceRouter.post("/check-out", checkOutController)
attendanceRouter.get("/retrive/:id", retrieveAttendanceController)
attendanceRouter.get("/retrieve/all-present-user", getAllUserController)

// Attendance
attendanceRouter.get("/attendance/:id", getAttendanceById)

// Attendance Correction Route
attendanceRouter.get("/attendance-correction", getAttendanceCorrectionController)
attendanceRouter.get("/attendance-correction/:id", getAttendanceCorrectionById)
attendanceRouter.get("/attendance-correction-all", getAllAttendanceCorrectionController)
attendanceRouter.post("/attendance-correction", authorize("write", "attendance-correction"), validate(attendanceCorrectionSchema), createAttendanceCorrectionController)
attendanceRouter.put("/attendance-correction", authorize("update", "attendance-correction"), validate(attendanceCorrectionUpdateSchema), updateAttendanceCorrectionController)

// Holiday Routes
attendanceRouter.post("/holiday/create", authorize("write", "holiday"), validate(holidaySchema), addHolidayController)
attendanceRouter.put("/holiday/update/:id", authorize("update", "holiday"), validate(holidayUpdateSchema), updateHolidayController)
attendanceRouter.get("/holiday/get-all", getAllHolidayController)
attendanceRouter.get("/holiday/get/:id", getHolidayController)
attendanceRouter.delete("/holiday/delete/:id", authorize("delete", "holiday"), deleteHolidayController)

// Cron Jobs
// Do Not Change This Part 
attendanceRouter.post("/cron/create/:pass", createAttendanceCron)
attendanceRouter.post("/cron/auto-checkout/:pass", autoCheckoutCron)

export default attendanceRouter
