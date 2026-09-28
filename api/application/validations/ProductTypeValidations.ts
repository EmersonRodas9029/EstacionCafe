import { z } from "zod";

export const createProductTypeSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(50, "El nombre no puede ser mayor a 50 caracteres")
    .trim(),
});

export const updateProductTypeSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(50, "El nombre no puede ser mayor a 50 caracteres")
    .trim()
    .optional(),
});

export const productTypeIdSchema = z.object({
  id: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El ID debe ser un número entero"),
    ])
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El ID debe ser un número positivo",
    ),
});
