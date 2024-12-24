import {
  getParents,
  createParent,
  getParentsBySchoolId,
} from "@/controllers/parents";
import express from "express";
const parentRouter = express.Router();

parentRouter.post("/parents", createParent);
parentRouter.get("/parents", getParents);
parentRouter.get("/parents/school/:schoolId", getParentsBySchoolId);
// schoolRouter.get("/customers/:id", getCustomerById);
// schoolRouter.get("/api/v2/customers", getV2Customers);

export default parentRouter;
