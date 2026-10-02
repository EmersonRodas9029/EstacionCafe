"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseIdSchema = exports.updatePurchaseSchema = exports.createPurchaseSchema = void 0;
const zod_1 = require("zod");
// Esquema para crear compra
exports.createPurchaseSchema = zod_1.z.object({
    date: zod_1.z
        .union([
        zod_1.z
            .string()
            .min(1, "La fecha es requerida")
            .refine((date) => !isNaN(Date.parse(date)), "La fecha debe ser válida")
            .transform((date) => new Date(date)),
        zod_1.z.date(),
    ])
        .refine((date) => date instanceof Date && !isNaN(date.getTime()), "La fecha debe ser válida")
        .transform((date) => (date instanceof Date ? date : new Date(date))),
    cashRegister: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("La caja registradora debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "La caja registradora debe ser un número positivo"),
    supplierId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del proveedor debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El proveedor debe ser un ID válido"),
    total: zod_1.z
        .string()
        .transform((val) => parseFloat(val))
        .refine((val) => !isNaN(val) && val > 0, "El total debe ser mayor a 0"),
});
// Esquema para actualizar compra
exports.updatePurchaseSchema = zod_1.z.object({
    date: zod_1.z
        .union([
        zod_1.z
            .string()
            .min(1, "La fecha es requerida")
            .refine((date) => !isNaN(Date.parse(date)), "La fecha debe ser válida")
            .transform((date) => new Date(date)),
        zod_1.z.date(),
    ])
        .refine((date) => date instanceof Date && !isNaN(date.getTime()), "La fecha debe ser válida")
        .transform((date) => (date instanceof Date ? date : new Date(date)))
        .optional(),
    cashRegister: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("La caja registradora debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "La caja registradora debe ser un número positivo")
        .optional(),
    supplierId: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID del proveedor debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El proveedor debe ser un ID válido")
        .optional(),
    total: zod_1.z
        .union([zod_1.z.string().transform((val) => parseFloat(val)), zod_1.z.number()])
        .refine((val) => !isNaN(val) && val > 0, "El total debe ser mayor a 0")
        .optional(),
});
// Esquema para ID
exports.purchaseIdSchema = zod_1.z.object({
    id: zod_1.z
        .union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int("El ID debe ser un número entero"),
    ])
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
