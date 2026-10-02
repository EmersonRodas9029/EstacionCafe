"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierIdSchema = exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
// Esquema para crear proveedor
exports.createSupplierSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, "El nombre no puede estar vacío")
        .max(100, "El nombre es muy largo")
        .trim(),
    phone: zod_1.z.string()
        .min(1, "El teléfono es requerido")
        .regex(/^(\+503)?[2-9]\d{3}-?\d{4}$/, "El teléfono debe tener formato válido (+503 XXXX-XXXX)")
        .transform((val) => val.replace(/\s|-/g, "")),
    email: zod_1.z.string()
        .min(1, "El email es requerido")
        .email("Debe ser un email válido")
        .toLowerCase(),
    active: zod_1.z.boolean().optional().default(true)
});
// Esquema para actualizar proveedor
exports.updateSupplierSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, "El nombre no puede estar vacío")
        .max(100, "El nombre es muy largo")
        .trim()
        .optional(),
    phone: zod_1.z.string()
        .min(1, "El teléfono es requerido")
        .regex(/^(\+503)?[2-9]\d{3}-?\d{4}$/, "El teléfono debe tener formato válido (+503 XXXX-XXXX)")
        .transform((val) => val.replace(/\s|-/g, ""))
        .optional(),
    email: zod_1.z.string()
        .min(1, "El email es requerido")
        .email("Debe ser un email válido")
        .toLowerCase()
        .optional(),
    active: zod_1.z.boolean().optional()
});
// Esquema para ID
exports.supplierIdSchema = zod_1.z.object({
    id: zod_1.z.string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo")
});
