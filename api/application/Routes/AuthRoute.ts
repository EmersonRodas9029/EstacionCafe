import { Router } from "express";
import * as auth from "../../controller/AuthController";

/** Rutas públicas de sesión (antes de verifyToken). */
export const authRouter = Router();

authRouter.post("/users/login", auth.login);
authRouter.post("/users/logout", auth.logout);
authRouter.post("/auth/pin", auth.pinLogin);
authRouter.get("/auth/device", auth.deviceStatus);
authRouter.delete("/auth/device", auth.forgetThisDevice);
