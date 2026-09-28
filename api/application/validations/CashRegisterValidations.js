"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashRegisterIdSchema = exports.updateCashRegisterSchema = exports.createCashRegisterSchema = void 0;
const zod_1 = require("zod");
// Esquema para crear caja registradora
exports.createCashRegisterSchema = zod_1.z.object({
    number: zod_1.z
        .string()
        .min(1, "El número es requerido")
        .max(20, "El número es muy largo")
        .trim()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
    active: zod_1.z.boolean().optional().default(true),
});
// Esquema para actualizar caja registradora
exports.updateCashRegisterSchema = zod_1.z.object({
    number: zod_1.z
        .string()
        .min(1, "El número es requerido")
        .max(20, "El número es muy largo")
        .trim()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
    active: zod_1.z.boolean().optional(),
});
// Esquema para ID
exports.cashRegisterIdSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
