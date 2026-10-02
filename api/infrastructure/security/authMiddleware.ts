import { NextFunction, Request, Response } from "express";
import type { AuthService } from "../../application/services/AuthService";
import { AppError } from "../../application/errors/AppError";
import { AUTH_COOKIE } from "./cookies";

let authService: AuthService | null = null;

export const initializeAuthMiddleware = (service: AuthService) => {
  authService = service;
};

/** Bearer solo para scripts y pruebas de API; el navegador usa la cookie httpOnly. */
export const extractToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[AUTH_COOKIE];
};

/** Exige una sesión vigente de un usuario activo y expone req.user. */
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).send({ status: "error", message: "No autenticado" });
  }
  if (!authService) {
    return res.status(500).send({ status: "error", message: "Autenticación no inicializada" });
  }
  try {
    (req as any).user = await authService.authenticate(token);
    next();
  } catch (error: any) {
    const status = error instanceof AppError ? error.statusCode : 401;
    return res.status(status).send({ status: "error", message: error.message || "No autenticado" });
  }
};
