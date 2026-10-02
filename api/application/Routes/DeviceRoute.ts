import { Router } from "express";
import * as auth from "../../controller/AuthController";
import { adminOnly } from "../../infrastructure/security/rbacMiddleware";

export const deviceRouter = Router();

deviceRouter.get("/devices", adminOnly, auth.listDevices);
deviceRouter.post("/devices", adminOnly, auth.registerDevice);
deviceRouter.put("/devices/:id", adminOnly, auth.updateDevice);
deviceRouter.delete("/devices/:id", adminOnly, auth.revokeDevice);

deviceRouter.put("/users/:id/pin", adminOnly, auth.setPin);
deviceRouter.delete("/users/:id/pin", adminOnly, auth.clearPin);
