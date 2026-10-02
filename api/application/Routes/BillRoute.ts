import { Router } from "express";
import {
  getBills,
  getBillById,
  saveBill,
  updateBill,
  deleteBill,
  getBillsByDateRange,
  getBillsByCustomer,
  getBillsByTable,
  closeBillsByTable,
} from "../../controller/BillController";
import { verifyToken } from "../../infrastructure/security/authMiddleware";
import { authorize } from "../../infrastructure/security/rbacMiddleware";

export const billRouter = Router();

billRouter.get("/bills", getBills);
billRouter.get("/bills/customer/:customer", getBillsByCustomer);
billRouter.get("/bills/table/:tableId", getBillsByTable);
billRouter.post("/bills/table/:tableId/close", closeBillsByTable);
billRouter.get("/bills/date-range", getBillsByDateRange);
billRouter.get("/bills/:id", getBillById);
billRouter.post("/bills", saveBill);
billRouter.put("/bills/:id", updateBill);
billRouter.delete(
  "/bills/:id",
  verifyToken,
  authorize(["admin", "mesero", "cajero"]),
  deleteBill,
);
