import { z } from "zod";

export const ConsumableTypeSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .trim(),
});

export const createConsumableTypeSchema = ConsumableTypeSchema;

export const updateConsumableTypeSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .trim()
,});

export const consumableTypeIdSchema = z.object({
  id: z.union([
    z.string().transform((val) => parseInt(val, 10)),
    z.number().int("El ID debe ser un número entero"),
  ])
    .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
