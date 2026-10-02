import { Router } from "express";
import {
  saveDetails,
  getDetails,
  deleteDetail,
  getDetailsByBillId,
  updateDetail,
} from "../../controller/BillDetailsController";
import { adminOnly, anyRole, staff } from "../../infrastructure/security/rbacMiddleware";

export const billDetailsRouter = Router();

billDetailsRouter.get("/bill-details", adminOnly, getDetails);
billDetailsRouter.get("/bill-details/bill/:billId", anyRole, getDetailsByBillId);
billDetailsRouter.post("/bill-details", staff, saveDetails);
billDetailsRouter.patch("/bill-details/:id", staff, updateDetail);
billDetailsRouter.delete("/bill-details/:id", staff, deleteDetail);
