import { NextFunction, Request, Response } from "express";
import { ITokenService } from "../../core/interfaces/ITokenService";

let tokenService: ITokenService | null = null;

export const initializeAuthMiddleware = (service: ITokenService) => {
  tokenService = service;
};

const extractToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.auth_token;
};

/** Exige un JWT válido (header Bearer o cookie auth_token) y expone req.user. */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);

  if (!token) {
    return res
      .status(401)
      .send({ status: "error", message: "Token no proporcionado" });
  }

  if (!tokenService) {
    return res.status(500).send({
      status: "error",
      message: "Servicio de tokens no inicializado",
    });
  }

  try {
    (req as any).user = await tokenService.verifyToken(token);
    next();
  } catch (error: any) {
    return res.status(401).send({
      status: "error",
      message: error.message || "Token inválido o expirado",
    });
  }
};
