import { Router, Request, Response } from "express";
import { addSession, deleteSession, editSession } from "./session/event.controller.js";
import { addWorkshop, deleteWorkshop, editWorkshop } from "./workshop/workshop.controller.js";

const eventRouter = Router();

// Session route
eventRouter.post("/session", addSession);
eventRouter.get("/session", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is a Session Router Page" })
});
eventRouter.delete("/session/:id", deleteSession)
eventRouter.patch("/session/:id", editSession)

// Workshop route
eventRouter.post("/workshop", addWorkshop);
eventRouter.get("/workshop", (req: Request, res: Response) => {
  return res.status(200).json({ message: "This Is a Session Router Page" })
});
eventRouter.delete("/workshop/:id", deleteWorkshop)
eventRouter.patch("/workshop/:id", editWorkshop)
export default eventRouter;

