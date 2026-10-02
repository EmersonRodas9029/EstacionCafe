"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
        .max(50, "El nombre de usuario es muy largo")
        .trim(),
    password: zod_1.z
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .max(100, "La contraseña es muy larga"),
    email: zod_1.z.string().email("Debe ser un email válido").toLowerCase(),
    typeId: zod_1.z.union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int().positive("El tipo de usuario debe ser un número positivo")
    ]).refine((val) => !isNaN(val) && val > 0, "El tipo de usuario debe ser un número positivo"),
});
exports.updateUserSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
        .max(50, "El nombre de usuario es muy largo")
        .trim().optional(),
    password: zod_1.z
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .max(100, "La contraseña es muy larga").optional(),
    email: zod_1.z.string().email("Debe ser un email válido").toLowerCase().optional(),
    typeId: zod_1.z.union([
        zod_1.z.string().transform((val) => parseInt(val, 10)),
        zod_1.z.number().int().positive("El tipo de usuario debe ser un número positivo")
    ]).refine((val) => !isNaN(val) && val > 0, "El tipo de usuario debe ser un número positivo").optional(),
});
exports.userIdSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo"),
});
