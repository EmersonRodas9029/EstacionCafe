"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billSchema = exports.tableIdSchema = exports.billIdSchema = exports.updateBillSchema = exports.createBillSchema = void 0;
const zod_1 = require("zod");
const Status_1 = require("../../core/enums/Status");
exports.createBillSchema = zod_1.z.object({
    cashRegister: zod_1.z
        .int()
        .refine((val) => !isNaN(val) && val > 0, "La caja registradora debe ser un número positivo0"),
    tableId: zod_1.z
        .string()
        .min(1, "El ID de la mesa es requerido")
        .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
        .trim()
        .optional(),
    total: zod_1.z
        .number()
        .nonnegative("El total no puede ser negativo")
        .refine((val) => Math.abs(val * 100 - Math.round(val * 100)) < 0.0001, "El total debe tener máximo 2 decimales"),
    status: zod_1.z.nativeEnum(Status_1.Status).optional(),
    customer: zod_1.z
        .string()
        .min(1, "El nombre del cliente es requerido")
        .max(100, "El nombre del cliente es muy largo")
        .trim(),
    date: zod_1.z
        .string()
        .or(zod_1.z.date())
        .transform((val) => {
        const utcDate = typeof val === "string" ? new Date(val) : val;
        const salvadorDate = new Date(utcDate.getTime() - 6 * 60 * 60 * 1000);
        return salvadorDate;
    })
        .refine((date) => !isNaN(date.getTime()), "La fecha debe ser válida"),
});
exports.updateBillSchema = zod_1.z
    .object({
    cashRegisterId: zod_1.z
        .number()
        .int("La caja registradora debe ser un número entero")
        .positive("La caja registradora debe ser un número positivo")
        .optional(),
    tableId: zod_1.z
        .string()
        .min(1, "El ID de la mesa es requerido")
        .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
        .trim()
        .optional(),
    total: zod_1.z
        .number()
        .nonnegative()
        .refine((val) => Math.abs(val * 100 - Math.round(val * 100)) < 0.0001, "El total debe tener máximo 2 decimales")
        .optional(),
    status: zod_1.z.nativeEnum(Status_1.Status).optional(),
    customer: zod_1.z
        .string()
        .min(1, "El nombre del cliente es requerido")
        .max(100, "El nombre del cliente es muy largo")
        .trim()
        .optional(),
    date: zod_1.z
        .string()
        .or(zod_1.z.date())
        .transform((val) => {
        const utcDate = typeof val === "string" ? new Date(val) : val;
        const salvadorDate = new Date(utcDate.getTime() - 6 * 60 * 60 * 1000);
        return salvadorDate;
    })
        .refine((date) => !isNaN(date.getTime()), "La fecha debe ser válida")
        .optional(),
})
    .strict();
exports.billIdSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
exports.tableIdSchema = zod_1.z.object({
    tableId: zod_1.z
        .string()
        .min(1, "El ID de la mesa es requerido")
        .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
        .trim(),
});
exports.billSchema = exports.createBillSchema;
