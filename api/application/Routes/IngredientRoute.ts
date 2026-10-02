import { Router } from "express";
import {
  getIngredients,
  getIngredientById,
  saveIngredient,
  updateIngredient,
  deleteIngredient,
  getIngredientsByProduct,
} from "../../controller/IngredientController";
import { adminOnly } from "../../infrastructure/security/rbacMiddleware";

export const ingredientRouter = Router();

ingredientRouter.use("/ingredient", adminOnly);

ingredientRouter.get("/ingredient", getIngredients);
ingredientRouter.get("/ingredient/product/:productId", getIngredientsByProduct);
ingredientRouter.get("/ingredient/:id", getIngredientById);
ingredientRouter.post("/ingredient", saveIngredient);
ingredientRouter.put("/ingredient/:id", updateIngredient);
ingredientRouter.delete("/ingredient/:id", deleteIngredient);
