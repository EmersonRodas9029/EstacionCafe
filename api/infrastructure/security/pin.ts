import { createHash, createHmac, randomBytes, randomInt } from "crypto";
import { env } from "../config/env";

export const PIN_LENGTH = 4;
export const PIN_PATTERN = /^\d{4}$/;

/**
 * Hash determinista con pepper: permite buscar al usuario por su PIN y
 * exigir que sea único, sin poder revertirlo sin el secreto.
 */
export const hashPin = (pin: string) =>
  createHmac("sha256", env.PIN_PEPPER).update(pin).digest("hex");

export const randomPin = () => String(randomInt(0, 10 ** PIN_LENGTH)).padStart(PIN_LENGTH, "0");

/** Token aleatorio del dispositivo (va a la cookie) y su hash (va a la BD). */
export const newDeviceToken = () => {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashDeviceToken(token) };
};

export const hashDeviceToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
