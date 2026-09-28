import { z } from "zod";

// Esquema para crear compra
export const createPurchaseSchema = z.object({
  date: z
    .union([
      z
        .string()
        .min(1, "La fecha es requerida")
        .refine((date) => !isNaN(Date.parse(date)), "La fecha debe ser válida")
        .transform((date) => new Date(date)),
      z.date(),
    ])
    .refine(
      (date) => date instanceof Date && !isNaN(date.getTime()),
      "La fecha debe ser válida"
    )
    .transform((date) => (date instanceof Date ? date : new Date(date))),

  cashRegister: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("La caja registradora debe ser un número entero"),
    ])
    .refine(
      (val) => !isNaN(val) && val > 0,
      "La caja registradora debe ser un número positivo"
    ),

  supplierId: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El ID del proveedor debe ser un número entero"),
    ])
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El proveedor debe ser un ID válido"
    ),

  total: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, "El total debe ser mayor a 0"),
});

// Esquema para actualizar compra
export const updatePurchaseSchema = z.object({
  date: z
    .union([
      z
        .string()
        .min(1, "La fecha es requerida")
        .refine((date) => !isNaN(Date.parse(date)), "La fecha debe ser válida")
        .transform((date) => new Date(date)),
      z.date(),
    ])
    .refine(
      (date) => date instanceof Date && !isNaN(date.getTime()),
      "La fecha debe ser válida"
    )
    .transform((date) => (date instanceof Date ? date : new Date(date)))
    .optional(),

  cashRegister: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("La caja registradora debe ser un número entero"),
    ])
    .refine(
      (val) => !isNaN(val) && val > 0,
      "La caja registradora debe ser un número positivo"
    )
    .optional(),

  supplierId: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El ID del proveedor debe ser un número entero"),
    ])
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El proveedor debe ser un ID válido"
    )
    .optional(),

  total: z
    .union([z.string().transform((val) => parseFloat(val)), z.number()])
    .refine((val) => !isNaN(val) && val > 0, "El total debe ser mayor a 0")
    .optional(),
});

// Esquema para ID
export const purchaseIdSchema = z.object({
  id: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El ID debe ser un número entero"),
    ])
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El ID debe ser un número positivo"
    ),
});
