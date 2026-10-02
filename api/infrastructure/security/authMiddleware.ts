import { Response, NextFunction } from "express";
import { ITokenService } from "../../core/interfaces/ITokenService";

let tokenService: ITokenService | null = null;

export const initializeAuthMiddleware = (service: ITokenService) => {
  tokenService = service;
};

export const verifyToken = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (process.env.SECURITY_MODE === "develop" && req.method !== "DELETE") {
      next();
      return;
    }

    // Obtener token del header Authorization o cookies
    const token =
      req.headers?.authorization?.replace("Bearer ", "") ||
      req.cookies?.auth_token;

    if (!token) {
      return res.status(401).send({
        status: "error",
        message: "Token no proporcionado",
      });
    }

    if (!tokenService) {
      return res.status(500).send({
        status: "error",
        message: "Servicio de tokens no inicializado",
      });
    }

    const data = await tokenService.verifyToken(token);

    req.user = data;
    console.log(data);

    next();
  } catch (error: any) {
    return res.status(401).send({
      status: "error",
      message: "Token inválido o expirado",
      error: error.message,
    });
  }
};
