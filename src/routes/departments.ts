import {
  getDepartments,
  createDepartment,
  getBriefDepartments,
  getDepartmentBySchoolId,
} from "@/controllers/departments";
import express from "express";
const departmentRouter = express.Router();

departmentRouter.post("/departments", createDepartment);
departmentRouter.get("/departments", getDepartments);
departmentRouter.get("/departments/school/:schoolId", getDepartmentBySchoolId);
departmentRouter.get("/departments/brief/:schoolId", getBriefDepartments);
// schoolRouter.get("/customers/:id", getCustomerById);
// schoolRouter.get("/api/v2/customers", getV2Customers);

export default departmentRouter;
