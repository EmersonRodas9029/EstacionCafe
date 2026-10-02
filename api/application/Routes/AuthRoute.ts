import { Router } from "express";
import * as userController from "../../controller/UserController";

export const authRouter = Router();

authRouter.post("/users/login", userController.login);
authRouter.post("/users/logout", userController.logout);
