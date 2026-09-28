import { Router } from "express";
import {
  getProductTypes,
  getProductTypeById,
  saveProductType,
  updateProductType,
  deleteProductType,
} from "../../controller/ProductTypeController";
import { verifyToken } from "../../infrastructure/security/authMiddleware";
import { authorize } from "../../infrastructure/security/rbacMiddleware";

export const productTypeRouter = Router();
productTypeRouter.get("/product-type", getProductTypes);
productTypeRouter.get("/product-type/:id", getProductTypeById);
productTypeRouter.post("/product-type", saveProductType);
productTypeRouter.put("/product-type/:id", updateProductType);
productTypeRouter.delete(
  "/product-type/:id",
  verifyToken,
  authorize(["all"]),
  deleteProductType,
);
