/** Error de negocio con status HTTP. El errorHandler lo traduce a la respuesta estándar. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly type?: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, type?: string) {
    return new AppError(400, message, type);
  }
  static unauthorized(message = "No autenticado") {
    return new AppError(401, message);
  }
  static forbidden(
    message = "Acceso denegado: no posee los permisos para esta función",
  ) {
    return new AppError(403, message);
  }
  static notFound(message: string) {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
}

/** Respuesta estándar para AppError dentro de los controladores. */
export const sendAppError = (res: any, error: AppError) =>
  res.status(error.statusCode).send({
    status: "error",
    message: error.message,
    ...(error.type && { type: error.type }),
  });
