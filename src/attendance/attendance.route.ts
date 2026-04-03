import { Router } from "express"
import { checkInController } from "./mark/check-in.controller.js"
import { checkOutController } from "./mark/check-out.controller.js"
import { updateHolidayController, getAllHolidayController, getHolidayController, deleteHolidayController, addHolidayController } from "./holiday/holiday.controller.js"
import { authorize } from "../permission/authorize.js"
import { validateHolidayCreate, validateHolidayUpdate } from "./holiday/holiday.middleware.js"
import { validateAttendanceCorrectionCreate, validateAttendanceCorrectionUpdate } from "./correction/correction.middleware.js"
import { createAttendanceCorrectionController, getAllAttendanceCorrectionController, getAttendanceCorrectionController, updateAttendanceCorrectionController } from "./correction/correction.controller.js"
import { todayAttendanceController } from "./retrieve/today.controller.js"
import { meAttendanceController } from "./retrieve/me.controller.js"
import { getPresentUserController } from "./retrieve/getPresentUser.controller.js"
import {  retrieveAttendanceController } from "./retrieve/retrieve-attendance.controller.js"

const attendanceRouter = Router()

attendanceRouter.get("/me", meAttendanceController)
attendanceRouter.get("/today", todayAttendanceController)
attendanceRouter.post("/check-in", checkInController)
attendanceRouter.post("/check-out", checkOutController)
attendanceRouter.get("/retrive",retrieveAttendanceController)
attendanceRouter.get("/retrieve/allPresentUser" , getPresentUserController)

attendanceRouter.get("/attendance-correction", getAttendanceCorrectionController)
attendanceRouter.get("/attendance-correction/all", getAllAttendanceCorrectionController)
attendanceRouter.post("/attendance-correction", authorize("write", "attendance-correction"), validateAttendanceCorrectionCreate, createAttendanceCorrectionController)
attendanceRouter.put("/attendance-correction", authorize("update", "attendance-correction"), validateAttendanceCorrectionUpdate, updateAttendanceCorrectionController)

attendanceRouter.post("/holiday/create", authorize("write", "holiday"), validateHolidayCreate, addHolidayController)
attendanceRouter.put("/holiday/update/:id", authorize("update", "holiday"), validateHolidayUpdate, updateHolidayController)
attendanceRouter.get("/holiday/get-all", getAllHolidayController)
attendanceRouter.get("/holiday/get/:id", getHolidayController)
attendanceRouter.delete("/holiday/delete/:id", authorize("delete", "holiday"), deleteHolidayController)



//For getting Attendance Record according to the date return the users which were present on that day 


export default attendanceRouter
