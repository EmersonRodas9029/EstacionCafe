import { z } from "zod";

export const createProductSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre no puede estar vacío")
      .max(50, "El nombre no puede ser mayor a 50 caracteres")
      .trim(),

    description: z
      .string()
      .min(1, "La descripción no puede estar vacía")
      .max(100, "La descripción no puede ser mayor a 100 caracteres")
      .trim(),

    price: z
      .union([z.string().transform((val) => parseFloat(val)), z.number()])
      .refine((val) => !isNaN(val) && val > 0, "El precio debe ser mayor a 0")
      .transform((val) => parseFloat(val.toFixed(2))),

    cost: z
      .union([z.string().transform((val) => parseFloat(val)), z.number()])
      .refine((val) => !isNaN(val) && val > 0, "El costo debe ser mayor a 0")
      .transform((val) => parseFloat(val.toFixed(2))),

    productTypeId: z
      .union([
        z.string().transform((val) => parseInt(val, 10)),
        z.number().int("El productTypeId debe ser un número entero"),
      ])
      .refine(
        (val) => !isNaN(val) && val > 0,
        "El productTypeId debe ser un número positivo",
      ),
  })
  .refine((data) => data.price > data.cost, {
    message: "El precio debe ser mayor al costo",
    path: ["price"],
  });

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(50, "El nombre no puede ser mayor a 50 caracteres")
    .trim()
    .optional(),

  description: z
    .string()
    .min(1, "La descripción no puede estar vacía")
    .max(100, "La descripción no puede ser mayor a 100 caracteres")
    .trim()
    .optional(),

  price: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, "El total debe ser mayor a 0")
    .optional(),

  cost: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, "El total debe ser mayor a 0")
    .optional(),

  productTypeId: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El productTypeId debe ser un número entero"),
    ])
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El productTypeId debe ser un número positivo",
    )
    .optional(),
});

export const productIdSchema = z.object({
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

export const productPriceRangeSchema = z
  .object({
    minPrice: z
      .union([z.string().transform((val) => parseFloat(val)), z.number()])
      .refine(
        (val) => !isNaN(val) && val >= 0,
        "El precio mínimo debe ser mayor o igual a 0",
      ),

    maxPrice: z
      .union([z.string().transform((val) => parseFloat(val)), z.number()])
      .refine(
        (val) => !isNaN(val) && val >= 0,
        "El precio máximo debe ser mayor o igual a 0",
      ),
  })
  .refine((data) => data.maxPrice >= data.minPrice, {
    message: "El precio máximo debe ser mayor o igual al precio mínimo",
    path: ["maxPrice"],
  });

// Mantener compatibilidad
export const productSchema = createProductSchema;
