"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingredientFilterSchema = exports.ingredientIdSchema = exports.updateIngredientSchema = exports.createIngredientSchema = exports.IngredientSchema = void 0;
const zod_1 = require("zod");
exports.IngredientSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim(),
    quantity: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseFloat(val)),
        zod_1.z.number()
    ])
        .refine((val) => !isNaN(val) && val > 0, "La cantidad debe ser mayor a 0"),
    productId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del producto debe ser un número entero")
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID del producto debe ser un número positivo"),
    consumableId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del consumible debe ser un número entero")
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID del consumible debe ser un número positivo"),
});
exports.createIngredientSchema = exports.IngredientSchema;
exports.updateIngredientSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim()
        .optional(),
    quantity: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseFloat(val)),
        zod_1.z.number()
    ])
        .refine((val) => !isNaN(val) && val > 0, "La cantidad debe ser mayor a 0")
        .optional(),
    productId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del producto debe ser un número entero")
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID del producto debe ser un número positivo")
        .optional(),
    consumableId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del consumible debe ser un número entero")
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID del consumible debe ser un número positivo")
        .optional(),
});
exports.ingredientIdSchema = zod_1.z.object({
    id: zod_1.z.union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID debe ser un número entero")
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo")
});
exports.ingredientFilterSchema = zod_1.z.object({
    productId: zod_1.z.union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del producto debe ser un número entero")
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID del producto debe ser un número positivo")
        .optional(),
    consumableId: zod_1.z.union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del consumible debe ser un número entero")
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID del consumible debe ser un número positivo")
        .optional(),
});
