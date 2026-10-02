import { z } from "zod";

export const pinLoginSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "El PIN debe tener 4 dígitos"),
});

export const setPinSchema = z.object({
  /** Sin pin: la API genera uno libre */
  pin: z.string().regex(/^\d{4}$/, "El PIN debe tener 4 dígitos").optional(),
});

export const deviceSchema = z.object({
  name: z.string().trim().min(1, "Escribe un nombre").max(60, "Máximo 60 caracteres"),
});

export const deviceUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    active: z.boolean().optional(),
  })
  .strict();

export const idParamSchema = z.object({
  id: z.coerce.number<number>().int().positive("El ID debe ser un número positivo"),
});
