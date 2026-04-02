import { Router } from "express"
import { checkInController } from "./mark/check-in.controller.js"
import { attendenceCorrectionReqController } from "./correction/attendenceCorrectionReq.controller.js"
import { checkOutController } from "./mark/check-out.controller.js"
import { attendenceCorrectionResController } from "./correction/attendenceCorrectionRes.controller.js"
import { showRequestedCorrection } from "./correction/attendenceShowReq.controller.js"
import { validateAttendenceCorrection } from "./correction/attendenceCorrection.middleware.js"
import { todayController } from "./mark/today.controller.js"
import { updateHolidayController, getAllHolidayController, getHolidayController, deleteHolidayController, addHolidayController } from "./holiday/holiday.controller.js"
import { authorize } from "../permission/authorize.js"
import { validateHolidayCreate, validateHolidayUpdate } from "./holiday/holiday.middleware.js"
import { Attendance } from "../database/attendance.model.js"
import { retrieveAttendanceController } from "./retrieve/retrieveAttendance.controller.js"


const attendenceRouter = Router()

attendenceRouter.get("/today", todayController)
attendenceRouter.post("/check-in", checkInController)
attendenceRouter.post("/check-out", checkOutController)

attendenceRouter.post("/attendenceCorrectionReq", validateAttendenceCorrection, attendenceCorrectionReqController)
attendenceRouter.post("/attendenceCorrectionRes", attendenceCorrectionResController)
attendenceRouter.get("/attendceCorrectionReq", showRequestedCorrection)

attendenceRouter.post("/holiday/create", authorize("write", "holiday"), validateHolidayCreate, addHolidayController)
attendenceRouter.put("/holiday/update/:id", authorize("update", "holiday"), validateHolidayUpdate, updateHolidayController)
attendenceRouter.get("/holiday/get-all", getAllHolidayController)
attendenceRouter.get("/holiday/get/:id", getHolidayController)
attendenceRouter.delete("/holiday/delete/:id", authorize("delete", "holiday"), deleteHolidayController)

attendenceRouter.get("/retrive",retrieveAttendanceController)

export default attendenceRouter
