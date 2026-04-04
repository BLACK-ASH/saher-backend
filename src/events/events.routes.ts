import {Router , Request, Response} from "express";
import { addEvent, deleteEvent, editEvent } from "./event/event.controller.js";

const router = Router();
router.post("/", addEvent);
router.get("/", (req: Request, res:Response) => {
  return res.status(200).json({ message: "This Is A EventRouter Page" })
});
router.delete("/:id",deleteEvent)
router.patch("/:id", editEvent)
export default router;