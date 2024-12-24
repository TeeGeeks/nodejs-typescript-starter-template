import {
  allocateSubjectsToTeacher,
  createTeacher,
  getTeacherAllocations,
  getTeacherAllocationsBySchoolId,
  getTeachers,
  getTeachersBySchoolId,
} from "@/controllers/teacher";
import express from "express";
const teacherRouter = express.Router();

teacherRouter.post("/teachers", createTeacher);
teacherRouter.get("/teachers", getTeachers);
teacherRouter.get("/teachers/school/:schoolId", getTeachersBySchoolId);
teacherRouter.post("/teachers/allocations", allocateSubjectsToTeacher);
teacherRouter.get("/teachers/allocations", getTeacherAllocations);
teacherRouter.get("/teachers/allocations/school", getTeacherAllocations);
teacherRouter.get(
  "/teachers/allocations/school/:schoolId",
  getTeacherAllocationsBySchoolId
);

export default teacherRouter;
