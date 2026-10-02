import { Router } from "express";
import {
    getIngredients,
    getIngredientById,
    saveIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientsByProduct
} from "../../controller/IngredientController";
import { verifyToken } from "../../infrastructure/security/authMiddleware";
import { authorize } from "../../infrastructure/security/rbacMiddleware";

export const ingredientRouter = Router();

ingredientRouter.get("/ingredient", getIngredients);
ingredientRouter.get("/ingredient/product/:productId", getIngredientsByProduct);
ingredientRouter.get("/ingredient/:id", getIngredientById);
ingredientRouter.post("/ingredient", saveIngredient);
ingredientRouter.put("/ingredient/:id", updateIngredient);
ingredientRouter.delete(
  "/ingredient/:id",
  verifyToken,
  authorize(["all"]),
  deleteIngredient,
);
