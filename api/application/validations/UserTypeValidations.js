"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userTypeIdSchema = exports.updateUserTypeSchema = exports.createUserTypeSchema = void 0;
const zod_1 = require("zod");
exports.createUserTypeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(50, "El nombre es muy largo")
        .trim(),
    permissionLevel: zod_1.z
        .number()
        .int("El nivel de permisos debe ser un número entero")
        .min(0, "El nivel de permisos no puede ser negativo")
        .max(10, "El nivel de permisos no puede ser mayor a 10"),
});
exports.updateUserTypeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "El nombre es requerido")
        .max(50, "El nombre es muy largo")
        .trim()
        .optional(),
    permissionLevel: zod_1.z
        .number()
        .int("El nivel de permisos debe ser un número entero")
        .min(0, "El nivel de permisos no puede ser negativo")
        .max(10, "El nivel de permisos no puede ser mayor a 10")
        .optional(),
});
exports.userTypeIdSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
