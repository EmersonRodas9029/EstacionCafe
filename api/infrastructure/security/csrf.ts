import { NextFunction, Request, Response } from "express";

export const CSRF_HEADER = "x-requested-with";
export const CSRF_VALUE = "EstacionCafe";
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Con la sesión en cookie, un sitio ajeno podría disparar peticiones con ella.
 * Las que modifican datos exigen un header propio: un formulario externo no
 * puede enviarlo y un fetch cruzado lo dispara en un preflight que CORS rechaza.
 * Con Bearer (scripts) no hay cookie de por medio y no aplica.
 */
export const requireCsrfHeader = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE.has(req.method) || req.headers.authorization?.startsWith("Bearer ")) return next();
  if (req.get(CSRF_HEADER) === CSRF_VALUE) return next();
  return res.status(403).send({
    status: "error",
    message: "Falta el header X-Requested-With",
  });
};
