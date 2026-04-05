import {Router , Request, Response} from "express";
import { addSession, deleteSession, editSession } from "./session/event.controller.js";

const sessionRouter = Router();
sessionRouter.post("/", addSession);
sessionRouter.get("/", (req: Request, res:Response) => {
  return res.status(200).json({ message: "This Is a Session Router Page" })
});
sessionRouter.delete("/:id",deleteSession)
sessionRouter.patch("/:id", editSession)
export default sessionRouter;