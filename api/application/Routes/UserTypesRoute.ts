import { Router } from "express";
import {
  getUserTypes,
  getUserTypeById,
  saveUserType,
  updateUserType,
  deleteUserType,
} from "../../controller/UserTypeController";
import { adminOnly } from "../../infrastructure/security/rbacMiddleware";

export const userTypeRouter = Router();

userTypeRouter.get("/user-types", adminOnly, getUserTypes);
userTypeRouter.get("/user-types/:id", adminOnly, getUserTypeById);
userTypeRouter.post("/user-types", adminOnly, saveUserType);
userTypeRouter.put("/user-types/:id", adminOnly, updateUserType);
userTypeRouter.delete("/user-types/:id", adminOnly, deleteUserType);
