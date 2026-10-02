import { Router } from "express";
import { getSalesReport } from "../../controller/ReportController";
import { adminOnly } from "../../infrastructure/security/rbacMiddleware";

export const reportRouter = Router();

reportRouter.get("/reports/sales", adminOnly, getSalesReport);
