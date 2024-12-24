import { getAnalyticsBySchoolId } from "@/controllers/analytics";
import express from "express";
const analyticsRouter = express.Router();

analyticsRouter.get("/analytics/school/:schoolId", getAnalyticsBySchoolId);

export default analyticsRouter;
