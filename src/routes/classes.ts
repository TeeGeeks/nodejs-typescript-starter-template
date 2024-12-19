import {
  createClasses,
  createSection,
  getClasses,
  getSections,
} from "@/controllers/classes";
import express from "express";
const classRouter = express.Router();

classRouter.post("/classes", createClasses);
classRouter.get("/classes", getClasses);
classRouter.post("/sections", createSection);
classRouter.get("/sections", getSections);

export default classRouter;
