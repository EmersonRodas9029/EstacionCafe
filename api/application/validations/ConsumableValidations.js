"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumableTypeSchema = exports.consumableIdSchema = exports.updateConsumableSchema = exports.createConsumableSchema = exports.ConsumableSchema = void 0;
const zod_1 = require("zod");
const UnitMeasurement_1 = require("../../core/enums/UnitMeasurement");
exports.ConsumableSchema = zod_1.z.object({
    supplierId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del proveedor debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID del proveedor debe ser un número positivo"),
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim(),
    cosumableTypeId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del tipo de consumible debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val >= 0, "El ID del tipo de consumible no puede ser negativo"),
    quantity: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val >= 0, "La cantidad no puede ser negativa"),
    unitMeasurement: zod_1.z.nativeEnum(UnitMeasurement_1.UnitMeasurement),
    cost: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val >= 0, "El costo no puede ser negativo"),
});
exports.createConsumableSchema = exports.ConsumableSchema;
exports.updateConsumableSchema = zod_1.z.object({
    supplierId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del proveedor debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID del proveedor debe ser un número positivo")
        .optional(),
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim()
        .optional(),
    cosumableTypeId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del tipo de consumible debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val >= 0, "El ID del tipo de consumible no puede ser negativo")
        .optional(),
    quantity: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val >= 0, "La cantidad no puede ser negativa")
        .optional(),
    unitMeasurement: zod_1.z.nativeEnum(UnitMeasurement_1.UnitMeasurement).optional(),
    cost: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val >= 0, "El costo no puede ser negativo")
        .optional(),
});
exports.consumableIdSchema = zod_1.z.object({
    id: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
exports.ConsumableTypeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim(),
});
