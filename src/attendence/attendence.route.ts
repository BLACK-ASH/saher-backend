import { Router } from "express"
import { checkInController } from "./mark/check-in.controller.js"
import { attendenceCorrectionReqController } from "./correction/attendenceCorrectionReq.controller.js"
import { checkOutController } from "./mark/check-out.controller.js"
import { attendenceCorrectionResController } from "./correction/attendenceCorrectionRes.controller.js"
import { showRequestedCorrection } from "./correction/attendenceShowReq.controller.js"
import { addholidayController } from "./holiday/add-holiday.controller.js"
import { updateHolidayController } from "./holiday/update-holiday.controller.js"
import { getAllHolidayController } from "./holiday/get-all-holiday.controller.js"
import { getHolidayController } from "./holiday/get-holiday.controller.js"
import { deleteHolidayController } from "./holiday/delete-holiday.controller.js"
import { validateAttendenceCorrection } from "./correction/attendenceCorrection.middleware.js"
import { todayController } from "./mark/today.controller.js"


const attendenceRouter = Router()

attendenceRouter.get("/today", todayController)
attendenceRouter.post("/check-in", checkInController)
attendenceRouter.post("/check-out", checkOutController)

attendenceRouter.post("/attendenceCorrectionReq", validateAttendenceCorrection, attendenceCorrectionReqController)
attendenceRouter.post("/attendenceCorrectionRes", attendenceCorrectionResController)
attendenceRouter.get("/attendceCorrectionReq", showRequestedCorrection)

attendenceRouter.post("/holiday/create", addholidayController)
attendenceRouter.put("/holiday/update/:id", updateHolidayController)
attendenceRouter.get("/holiday/get-all", getAllHolidayController)
attendenceRouter.get("/holiday/get/:id", getHolidayController)
attendenceRouter.delete("/holiday/delete/:id", deleteHolidayController)

export default attendenceRouter
