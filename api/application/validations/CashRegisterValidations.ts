import { z } from "zod";

// Esquema para crear caja registradora
export const createCashRegisterSchema = z.object({
  number: z
    .string()
    .min(1, "El número es requerido")
    .max(20, "El número es muy largo")
    .trim()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El ID debe ser un número positivo"
    ),

  active: z.boolean().optional().default(true),
});

// Esquema para actualizar caja registradora
export const updateCashRegisterSchema = z.object({
  number: z
    .string()
    .min(1, "El número es requerido")
    .max(20, "El número es muy largo")
    .trim()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El ID debe ser un número positivo"
    ),
  active: z.boolean().optional(),
});

// Esquema para ID
export const cashRegisterIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El ID debe ser un número positivo"
    ),
});
