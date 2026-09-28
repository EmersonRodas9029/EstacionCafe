import { Router } from "express";
import {
  getProducts,
  getProductById,
  saveProduct,
  updateProduct,
  deleteProduct,
  getActiveProducts,
} from "../../controller/ProductController";
import { verifyToken } from "../../infrastructure/security/authMiddleware";
import { authorize } from "../../infrastructure/security/rbacMiddleware";

export const productRouter = Router();

productRouter.get("/products", getProducts);
productRouter.get("/products/active", getActiveProducts);
productRouter.get("/products/:id", getProductById);
productRouter.post("/products", saveProduct);
productRouter.put("/products/:id", updateProduct);
productRouter.delete(
  "/products/:id",
  verifyToken,
  authorize(["all"]),
  deleteProduct,
);
