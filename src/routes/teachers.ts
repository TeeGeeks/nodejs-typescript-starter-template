import {
  allocateSubjectsToTeacher,
  createTeacher,
  getTeacherAllocations,
  getTeachers,
} from "@/controllers/teacher";
import express from "express";
const teacherRouter = express.Router();

teacherRouter.post("/teachers", createTeacher);
teacherRouter.get("/teachers", getTeachers);
teacherRouter.post("/teachers/allocations", allocateSubjectsToTeacher);
teacherRouter.get("/teachers/allocations", getTeacherAllocations);

export default teacherRouter;
