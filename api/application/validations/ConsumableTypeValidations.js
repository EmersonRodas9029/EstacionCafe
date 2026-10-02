"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumableTypeIdSchema = exports.updateConsumableTypeSchema = exports.createConsumableTypeSchema = exports.ConsumableTypeSchema = void 0;
const zod_1 = require("zod");
exports.ConsumableTypeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim(),
});
exports.createConsumableTypeSchema = exports.ConsumableTypeSchema;
exports.updateConsumableTypeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim(),
});
exports.consumableTypeIdSchema = zod_1.z.object({
    id: zod_1.z.union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
