import {
  saveDetails,
  getDetails,
  deleteDetail,
  getDetailsByBillId,
} from "../../controller/BillDetailsController";
import { Router } from "express";
import { authorize } from "../../infrastructure/security/rbacMiddleware";
import { verifyToken } from "../../infrastructure/security/authMiddleware";

export const billDetailsRouter = Router();

billDetailsRouter.post("/bill-details", saveDetails);
billDetailsRouter.get("/bill-details", getDetails);
billDetailsRouter.get("/bill-details/bill/:billId", getDetailsByBillId);
billDetailsRouter.delete(
  "/bill-details/:id",
  verifyToken,
  authorize(["admin", "mesero", "cajero"]),
  deleteDetail,
);
