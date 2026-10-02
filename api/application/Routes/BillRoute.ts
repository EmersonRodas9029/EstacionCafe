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
  voidBill,
} from "../../controller/BillController";
import { adminOnly, anyRole, staff } from "../../infrastructure/security/rbacMiddleware";

export const billRouter = Router();

billRouter.get("/bills", anyRole, getBills);
billRouter.get("/bills/customer/:customer", anyRole, getBillsByCustomer);
billRouter.get("/bills/table/:tableId", anyRole, getBillsByTable);
billRouter.post("/bills/table/:tableId/close", staff, closeBillsByTable);
billRouter.get("/bills/date-range", anyRole, getBillsByDateRange);
billRouter.get("/bills/:id", anyRole, getBillById);
billRouter.post("/bills", staff, saveBill);
billRouter.put("/bills/:id", staff, updateBill);
billRouter.post("/bills/:id/void", adminOnly, voidBill);
billRouter.delete("/bills/:id", adminOnly, deleteBill);
