import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../application/errors/AppError";

/** 404 para rutas inexistentes bajo /api. */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).send({
    status: "error",
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

/** Último middleware: respuesta uniforme y sin detalles internos. */
export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).send({
      status: "error",
      message: error.message,
      ...(error.type && { type: error.type }),
    });
  }

  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return res.status(400).send({
      status: "error",
      message: "Datos inválidos: " + issue?.message,
      campo: issue?.path,
      error: issue?.code,
    });
  }

  // JSON mal formado en el body
  if (error?.type === "entity.parse.failed") {
    return res
      .status(400)
      .send({ status: "error", message: "JSON inválido en el cuerpo" });
  }

  if (error?.message === "Origen no permitido por CORS") {
    return res.status(403).send({ status: "error", message: error.message });
  }

  console.error("Error no controlado:", error);
  return res
    .status(500)
    .send({ status: "error", message: "Error interno del servidor" });
};
