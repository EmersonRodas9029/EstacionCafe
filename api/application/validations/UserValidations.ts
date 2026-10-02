import { z } from "zod";

export const createUserSchema = z.object({
    username: z
        .string()
        .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
        .max(50, "El nombre de usuario es muy largo")
        .trim(),

    password: z
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .max(100, "La contraseña es muy larga"),

    email: z.string().email("Debe ser un email válido").toLowerCase(),

    typeId: z.union([
        z.string().transform((val) => parseInt(val, 10)),
        z.number().int().positive("El tipo de usuario debe ser un número positivo")
    ]).refine((val) => !isNaN(val) && val > 0, "El tipo de usuario debe ser un número positivo"),
});

export const updateUserSchema = z.object({
    username: z
        .string()
        .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
        .max(50, "El nombre de usuario es muy largo")
        .trim().optional(),

    password: z
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .max(100, "La contraseña es muy larga").optional(),

    email: z.string().email("Debe ser un email válido").toLowerCase().optional(),

    typeId: z.union([
        z.string().transform((val) => parseInt(val, 10)),
        z.number().int().positive("El tipo de usuario debe ser un número positivo")
    ]).refine((val) => !isNaN(val) && val > 0, "El tipo de usuario debe ser un número positivo").optional(),
});

export const userIdSchema = z.object({
    id: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine(
            (val) => !isNaN(val) && val > 0,
            "El ID debe ser un número positivo"
        ),
});