import { z } from "zod";

export const IngredientSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .trim(),

  quantity: z
    .union([
      z.string().transform((val) => parseFloat(val)),
      z.number()
    ])
    .refine((val) => !isNaN(val) && val > 0, "La cantidad debe ser mayor a 0"),

  productId: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El ID del producto debe ser un número entero")
    ])
    .refine((val) => !isNaN(val) && val > 0, "El ID del producto debe ser un número positivo"),

  consumableId: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El ID del consumible debe ser un número entero")
    ])
    .refine((val) => !isNaN(val) && val > 0, "El ID del consumible debe ser un número positivo"),
});

export const createIngredientSchema = IngredientSchema;

export const updateIngredientSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .trim()
    .optional(),

  quantity: z
    .union([
      z.string().transform((val) => parseFloat(val)),
      z.number()
    ])
    .refine((val) => !isNaN(val) && val > 0, "La cantidad debe ser mayor a 0")
    .optional(),

  productId: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El ID del producto debe ser un número entero")
    ])
    .refine((val) => !isNaN(val) && val > 0, "El ID del producto debe ser un número positivo")
    .optional(),

  consumableId: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int("El ID del consumible debe ser un número entero")
    ])
    .refine((val) => !isNaN(val) && val > 0, "El ID del consumible debe ser un número positivo")
    .optional(),
});

export const ingredientIdSchema = z.object({
  id: z.union([
    z.string().transform((val) => parseInt(val, 10)),
    z.number().int("El ID debe ser un número entero")
  ])
    .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo")
});

export const ingredientFilterSchema = z.object({
  productId: z.union([
    z.string().transform((val) => parseInt(val, 10)),
    z.number().int("El ID del producto debe ser un número entero")
  ])
    .refine((val) => !isNaN(val) && val > 0, "El ID del producto debe ser un número positivo")
    .optional(),

  consumableId: z.union([
    z.string().transform((val) => parseInt(val, 10)),
    z.number().int("El ID del consumible debe ser un número entero")
  ])
    .refine((val) => !isNaN(val) && val > 0, "El ID del consumible debe ser un número positivo")
    .optional(),
});

export type IngredientInput = z.infer<typeof IngredientSchema>;
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
