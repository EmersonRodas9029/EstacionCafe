import { Router } from "express";
import {
  getProducts,
  getProductById,
  saveProduct,
  updateProduct,
  deleteProduct,
  getActiveProducts,
} from "../../controller/ProductController";
import { adminOnly, anyRole } from "../../infrastructure/security/rbacMiddleware";

export const productRouter = Router();

productRouter.get("/products", anyRole, getProducts);
productRouter.get("/products/active", anyRole, getActiveProducts);
productRouter.get("/products/:id", anyRole, getProductById);
productRouter.post("/products", adminOnly, saveProduct);
productRouter.put("/products/:id", adminOnly, updateProduct);
productRouter.delete("/products/:id", adminOnly, deleteProduct);
