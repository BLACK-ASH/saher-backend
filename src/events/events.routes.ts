import express from "express";
import { addEvent, deleteEvent, editEvent } from "./event/event.controller.js";

const router = express.Router();
router.post("/", addEvent);
router.get("/", (req, res) => {
  res.send("Programs API is working");
});
router.delete("/:id",deleteEvent)
router.patch("/:id", editEvent)
export default router;