"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = exports.productPriceRangeSchema = exports.productIdSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z
    .object({
    name: zod_1.z
        .string()
        .min(1, "El nombre no puede estar vacío")
        .max(50, "El nombre no puede ser mayor a 50 caracteres")
        .trim(),
    description: zod_1.z
        .string()
        .min(1, "La descripción no puede estar vacía")
        .max(100, "La descripción no puede ser mayor a 100 caracteres")
        .trim(),
    price: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val > 0, "El precio debe ser mayor a 0")
        .transform((val) => parseFloat(val.toFixed(2))),
    cost: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val > 0, "El costo debe ser mayor a 0")
        .transform((val) => parseFloat(val.toFixed(2))),
    productTypeId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El productTypeId debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El productTypeId debe ser un número positivo"),
})
    .refine((data) => data.price > data.cost, {
    message: "El precio debe ser mayor al costo",
    path: ["price"],
});
exports.updateProductSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre no puede estar vacío")
        .max(50, "El nombre no puede ser mayor a 50 caracteres")
        .trim()
        .optional(),
    description: zod_1.z
        .string()
        .min(1, "La descripción no puede estar vacía")
        .max(100, "La descripción no puede ser mayor a 100 caracteres")
        .trim()
        .optional(),
    price: zod_1.z
        .string()
        .transform((val) => parseFloat(val))
        .refine((val) => !isNaN(val) && val > 0, "El total debe ser mayor a 0")
        .optional(),
    cost: zod_1.z
        .string()
        .transform((val) => parseFloat(val))
        .refine((val) => !isNaN(val) && val > 0, "El total debe ser mayor a 0")
        .optional(),
    productTypeId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El productTypeId debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El productTypeId debe ser un número positivo")
        .optional(),
});
exports.productIdSchema = zod_1.z.object({
    id: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
exports.productPriceRangeSchema = zod_1.z
    .object({
    minPrice: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val >= 0, "El precio mínimo debe ser mayor o igual a 0"),
    maxPrice: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val >= 0, "El precio máximo debe ser mayor o igual a 0"),
})
    .refine((data) => data.maxPrice >= data.minPrice, {
    message: "El precio máximo debe ser mayor o igual al precio mínimo",
    path: ["maxPrice"],
});
// Mantener compatibilidad
exports.productSchema = exports.createProductSchema;
