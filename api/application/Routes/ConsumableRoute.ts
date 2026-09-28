import { Router } from "express";
import {
  getConsumables,
  getConsumableById,
  saveConsumable,
  updateConsumable,
  deleteConsumable,
  getConsumablesBySupplier,
} from "../../controller/ConsumableController";
import { authorize } from "../../infrastructure/security/rbacMiddleware";
import { verifyToken } from "../../infrastructure/security/authMiddleware";

export const consumableRouter = Router();

consumableRouter.get("/consumable", getConsumables);
consumableRouter.get(
  "/consumable/supplier/:supplierId",
  getConsumablesBySupplier,
);
consumableRouter.get("/consumable/:id", getConsumableById);
consumableRouter.post("/consumable", saveConsumable);
consumableRouter.put("/consumable/:id", updateConsumable);
consumableRouter.delete(
  "/consumable/:id",
  verifyToken,
  authorize(["all"]),
  deleteConsumable,
);
