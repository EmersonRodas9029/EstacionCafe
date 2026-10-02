import { z } from "zod";

const numberField = z
  .union([z.string(), z.number()])
  .transform((val) => String(val).trim())
  .refine((val) => val.length >= 1, "El número es requerido")
  .refine((val) => val.length <= 20, "El número es muy largo");

export const createCashRegisterSchema = z.object({
  number: numberField,
  active: z.boolean().optional().default(true),
});

export const updateCashRegisterSchema = z.object({
  number: numberField.optional(),
  active: z.boolean().optional(),
});

export const cashRegisterIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El ID debe ser un número positivo",
    ),
});
