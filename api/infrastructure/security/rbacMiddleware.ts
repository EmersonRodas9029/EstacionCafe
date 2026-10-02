import { NextFunction, Request, Response } from "express";
import { Role } from "../../core/enums/Role";

type AllowedRoles = (Role | `${Role}` | "all")[];

/**
 * Autoriza por rol. Debe ir después de verifyToken.
 * "all" = cualquier usuario autenticado.
 */
export const authorize = (allowedRoles: AllowedRoles) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role as string | undefined;

    if (!role) {
      return res
        .status(401)
        .send({ status: "error", message: "No autenticado" });
    }

    if (
      allowedRoles.includes("all") ||
      (allowedRoles as string[]).includes(role)
    ) {
      return next();
    }

    return res.status(403).send({
      status: "error",
      message:
        "Acceso denegado: No posee los permisos para acceder a esta función",
    });
  };
};

/** Atajos de uso común en las rutas. */
export const anyRole = authorize(["all"]);
export const adminOnly = authorize([Role.ADMIN]);
export const staff = authorize([Role.ADMIN, Role.MESERO, Role.CAJERO]);
export const cashierOrAdmin = authorize([Role.ADMIN, Role.CAJERO]);
