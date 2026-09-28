import { Router } from "express";
import * as userController from "../../controller/UserController";
import { verifyToken } from "../../infrastructure/security/authMiddleware";
import { authorize } from "../../infrastructure/security/rbacMiddleware";

export const userRouter = Router();

// Rutas públicas (sin protección)
userRouter.post("/users/login", userController.login);
userRouter.post("/users/logout", userController.logout);

userRouter.get("/users", userController.getUsers);
userRouter.get("/users/type/:typeId", userController.getUsersByType);
userRouter.get("/users/:id", userController.getUserById);
userRouter.post("/users", userController.saveUser);
userRouter.put("/users/:id", userController.updateUser);
userRouter.delete(
  "/users/:id",
  verifyToken,
  authorize(["admin"]),
  userController.deleteUser,
);
