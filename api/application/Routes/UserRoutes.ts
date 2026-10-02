import { Router } from "express";
import * as userController from "../../controller/UserController";
import { adminOnly, anyRole } from "../../infrastructure/security/rbacMiddleware";

export const userRouter = Router();

userRouter.get("/users/me", anyRole, userController.me);
userRouter.get("/users", adminOnly, userController.getUsers);
userRouter.get("/users/type/:typeId", adminOnly, userController.getUsersByType);
userRouter.get("/users/:id", adminOnly, userController.getUserById);
userRouter.post("/users", adminOnly, userController.saveUser);
userRouter.put("/users/:id", adminOnly, userController.updateUser);
userRouter.delete("/users/:id", adminOnly, userController.deleteUser);
