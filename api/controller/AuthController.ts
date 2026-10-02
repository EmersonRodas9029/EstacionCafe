import { NextFunction, Request, Response } from "express";
import type { AuthService, IssuedSession } from "../application/services/AuthService";
import { loginSchema } from "../application/validations/UserValidations";
import {
  deviceSchema,
  deviceUpdateSchema,
  idParamSchema,
  pinLoginSchema,
  setPinSchema,
} from "../application/validations/AuthValidations";
import { AUTH_COOKIE, authCookie, DEVICE_COOKIE, deviceCookie } from "../infrastructure/security/cookies";
import { extractToken } from "../infrastructure/security/authMiddleware";

let service: AuthService | null = null;
export const setService = (authService: AuthService) => {
  service = authService;
};
const auth = () => {
  if (!service) throw new Error("AuthService no inicializado");
  return service;
};

/** Errores (AppError, Zod) los traduce el errorHandler global. */
const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/**
 * El token va solo en la cookie httpOnly. Los scripts y pruebas que usan Bearer
 * lo piden explícitamente con `X-Token-In-Body: true`.
 */
const sendSession = (req: Request, res: Response, session: IssuedSession, message: string) => {
  const withToken = req.get("x-token-in-body") === "true";
  res
    .status(200)
    .cookie(AUTH_COOKIE, session.token, authCookie(session.maxAgeMs))
    .send({
      status: "success",
      message,
      data: {
        user: session.user,
        expiresIn: session.maxAgeMs / 1000,
        ...(withToken && { token: session.token }),
      },
    });
};

export const login = handle(async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);
  const session = await auth().loginWithPassword(username, password, req.cookies?.[DEVICE_COOKIE]);
  sendSession(req, res, session, "Inicio de sesión exitoso");
});

export const pinLogin = handle(async (req, res) => {
  const { pin } = pinLoginSchema.parse(req.body);
  const session = await auth().loginWithPin(pin, req.cookies?.[DEVICE_COOKIE]);
  sendSession(req, res, session, "Inicio de sesión exitoso");
});

export const logout = handle(async (req, res) => {
  await auth().logout(extractToken(req));
  res.clearCookie(AUTH_COOKIE, { path: "/" }).send({ status: "success", message: "Sesión cerrada" });
});

/** Público: el login decide si muestra el teclado de PIN. */
export const deviceStatus = handle(async (req, res) => {
  const device = await auth().deviceFromToken(req.cookies?.[DEVICE_COOKIE]);
  res.send({
    status: "success",
    message: device ? "Dispositivo autorizado" : "Dispositivo no autorizado",
    data: { authorized: !!device, name: device?.name ?? null },
  });
});

// ---------- Dispositivos (admin) ----------

export const listDevices = handle(async (_req, res) => {
  res.send({ status: "success", message: "Dispositivos", data: await auth().listDevices() });
});

export const registerDevice = handle(async (req, res) => {
  const { name } = deviceSchema.parse(req.body);
  const { device, token } = await auth().registerDevice(name, (req as any).user.userId);
  res
    .status(201)
    .cookie(DEVICE_COOKIE, token, deviceCookie())
    .send({ status: "success", message: "Dispositivo autorizado", data: device });
});

export const updateDevice = handle(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const data = deviceUpdateSchema.parse(req.body);
  res.send({ status: "success", message: "Dispositivo actualizado", data: await auth().updateDevice(id, data) });
});

export const revokeDevice = handle(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const device = await auth().updateDevice(id, { active: false });
  res.send({ status: "success", message: "Dispositivo revocado", data: device });
});

/** Quita la autorización del equipo actual (solo borra su cookie). */
export const forgetThisDevice = handle(async (_req, res) => {
  res.clearCookie(DEVICE_COOKIE, { path: "/api" }).send({ status: "success", message: "Dispositivo olvidado" });
});

// ---------- PIN de usuarios (admin) ----------

export const setPin = handle(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { pin } = setPinSchema.parse(req.body ?? {});
  const assigned = await auth().setPin(id, pin);
  // El PIN se muestra una sola vez: no se puede volver a consultar
  res.send({ status: "success", message: "PIN asignado", data: { pin: assigned } });
});

export const clearPin = handle(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await auth().clearPin(id);
  res.send({ status: "success", message: "PIN eliminado", data: { id } });
});
