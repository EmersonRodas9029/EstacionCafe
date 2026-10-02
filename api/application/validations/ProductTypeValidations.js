"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productTypeIdSchema = exports.updateProductTypeSchema = exports.createProductTypeSchema = void 0;
const zod_1 = require("zod");
exports.createProductTypeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre no puede estar vacío")
        .max(50, "El nombre no puede ser mayor a 50 caracteres")
        .trim(),
});
exports.updateProductTypeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre no puede estar vacío")
        .max(50, "El nombre no puede ser mayor a 50 caracteres")
        .trim()
        .optional(),
});
exports.productTypeIdSchema = zod_1.z.object({
    id: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
