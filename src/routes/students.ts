import {
  createStudent,
  getNextSequence,
  getStudents,
  getStudentsBySchoolId,
} from "@/controllers/students";
import express from "express";
const studentRouter = express.Router();

studentRouter.post("/students", createStudent);
studentRouter.get("/students", getStudents);
studentRouter.get("/students/school/:schoolId", getStudentsBySchoolId);
studentRouter.get("/students/seq/:schoolId", getNextSequence);
// schoolRouter.get("/customers/:id", getCustomerById);
// schoolRouter.get("/api/v2/customers", getV2Customers);

export default studentRouter;
