import { Router } from "express";
import {
  getProductTypes,
  getProductTypeById,
  saveProductType,
  updateProductType,
  deleteProductType,
} from "../../controller/ProductTypeController";
import { adminOnly, anyRole } from "../../infrastructure/security/rbacMiddleware";

export const productTypeRouter = Router();

productTypeRouter.get("/product-type", anyRole, getProductTypes);
productTypeRouter.get("/product-type/:id", anyRole, getProductTypeById);
productTypeRouter.post("/product-type", adminOnly, saveProductType);
productTypeRouter.put("/product-type/:id", adminOnly, updateProductType);
productTypeRouter.delete("/product-type/:id", adminOnly, deleteProductType);
