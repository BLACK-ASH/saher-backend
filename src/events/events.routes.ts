import { Router, Request, Response } from "express";
import { addSession, deleteSession, editSession } from "./session/event.controller.js";
import { addWorkshop, deleteWorkshop, editWorkshop } from "./workshop/workshop.controller.js";


const eventRouter = Router();

// Session route
eventRouter.post("/", addSession);
eventRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is a Session Router Page" })
});
eventRouter.delete("/:id", deleteSession)
eventRouter.patch("/:id", editSession)

// Workshop route
eventRouter.post("/", addWorkshop);
eventRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is a Session Router Page" })
});
eventRouter.delete("/:id", deleteWorkshop)
eventRouter.patch("/:id", editWorkshop)
export default eventRouter;