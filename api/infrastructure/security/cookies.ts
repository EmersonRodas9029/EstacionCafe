import { CookieOptions } from "express";
import { env } from "../config/env";

export const AUTH_COOKIE = "auth_token";
export const DEVICE_COOKIE = "device_token";

const base: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
};

export const authCookie = (maxAgeMs: number): CookieOptions => ({ ...base, path: "/", maxAge: maxAgeMs });

/** La autorización del dispositivo dura hasta que el admin la revoque. */
export const deviceCookie = (): CookieOptions => ({
  ...base,
  path: "/api",
  maxAge: 5 * 365 * 24 * 60 * 60 * 1000,
});
