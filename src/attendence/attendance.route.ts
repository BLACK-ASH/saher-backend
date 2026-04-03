import { Router } from "express"
import { checkInController } from "./mark/check-in.controller.js"
import { attendanceCorrectionReqController } from "./correction/attendanceCorrectionReq.controller.js"
import { checkOutController } from "./mark/check-out.controller.js"
import { attendanceCorrectionResController } from "./correction/attendanceCorrectionRes.controller.js"
import { showRequestedCorrection } from "./correction/attendanceShowReq.controller.js"
import { validateAttendanceCorrection } from "./correction/attendanceCorrection.middleware.js"
import { todayController } from "./mark/today.controller.js"
import { updateHolidayController, getAllHolidayController, getHolidayController, deleteHolidayController, addHolidayController } from "./holiday/holiday.controller.js"
import { authorize } from "../permission/authorize.js"
import { validateHolidayCreate, validateHolidayUpdate } from "./holiday/holiday.middleware.js"
import { Attendance } from "../database/attendance.model.js"
import { retrieveAttendanceController } from "./retrieve/retrieveAttendance.controller.js"


const attendanceRouter = Router()

attendanceRouter.get("/today", todayController)
attendanceRouter.post("/check-in", checkInController)
attendanceRouter.post("/check-out", checkOutController)

attendanceRouter.post("/attendenceCorrectionReq", validateAttendanceCorrection, attendanceCorrectionReqController)
attendanceRouter.post("/attendenceCorrectionRes", attendanceCorrectionResController)
attendanceRouter.get("/attendceCorrectionReq", showRequestedCorrection)

attendanceRouter.post("/holiday/create", authorize("write", "holiday"), validateHolidayCreate, addHolidayController)
attendanceRouter.put("/holiday/update/:id", authorize("update", "holiday"), validateHolidayUpdate, updateHolidayController)
attendanceRouter.get("/holiday/get-all", getAllHolidayController)
attendanceRouter.get("/holiday/get/:id", getHolidayController)
attendanceRouter.delete("/holiday/delete/:id", authorize("delete", "holiday"), deleteHolidayController)

attendanceRouter.get("/retrive",retrieveAttendanceController)

export default attendanceRouter
