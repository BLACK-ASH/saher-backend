import {Router , Request, Response} from "express";
import { addEvent, deleteEvent, editEvent } from "./event/event.controller.js";

const eventRouter = Router();
eventRouter.post("/", addEvent);
eventRouter.get("/", (req: Request, res:Response) => {
  return res.status(200).json({ message: "This Is a Event Router Page" })
});
eventRouter.delete("/:id",deleteEvent)
eventRouter.patch("/:id", editEvent)
export default eventRouter;