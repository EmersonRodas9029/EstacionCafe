import { Router } from "express";
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchasesBySupplier,
} from "../../controller/PurchaseController";
import { adminOnly } from "../../infrastructure/security/rbacMiddleware";

export const purchaseRouter = Router();

purchaseRouter.use("/purchases", adminOnly);

purchaseRouter.get("/purchases", getPurchases);
purchaseRouter.get("/purchases/supplier/:supplierId", getPurchasesBySupplier);
purchaseRouter.get("/purchases/:id", getPurchaseById);
purchaseRouter.post("/purchases", createPurchase);
purchaseRouter.put("/purchases/:id", updatePurchase);
purchaseRouter.delete("/purchases/:id", deletePurchase);
