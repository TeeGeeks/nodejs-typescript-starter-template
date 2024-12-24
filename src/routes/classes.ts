import {
  createClasses,
  createSection,
  getClasses,
  getClassesBySchoolId,
  getSections,
} from "@/controllers/classes";
import express from "express";
const classRouter = express.Router();

classRouter.post("/classes", createClasses);
classRouter.get("/classes", getClasses);
classRouter.get("/classes/school/:schoolId", getClassesBySchoolId);
classRouter.post("/sections", createSection);
classRouter.get("/sections", getSections);

export default classRouter;
