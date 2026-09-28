import { z } from 'zod';

// Esquema para crear proveedor
export const createSupplierSchema = z.object({
    name: z.string()
        .min(1, "El nombre no puede estar vacío")
        .max(100, "El nombre es muy largo")
        .trim(),

    phone: z.string()
        .min(1, "El teléfono es requerido")
        .regex(/^(\+503)?[2-9]\d{3}-?\d{4}$/, "El teléfono debe tener formato válido (+503 XXXX-XXXX)")
        .transform((val) => val.replace(/\s|-/g, "")),

    email: z.string()
        .min(1, "El email es requerido")
        .email("Debe ser un email válido")
        .toLowerCase(),

    active: z.boolean().optional().default(true)
});

// Esquema para actualizar proveedor
export const updateSupplierSchema = z.object({
    name: z.string()
        .min(1, "El nombre no puede estar vacío")
        .max(100, "El nombre es muy largo")
        .trim()
        .optional(),

    phone: z.string()
        .min(1, "El teléfono es requerido")
        .regex(/^(\+503)?[2-9]\d{3}-?\d{4}$/, "El teléfono debe tener formato válido (+503 XXXX-XXXX)")
        .transform((val) => val.replace(/\s|-/g, ""))
        .optional(),

    email: z.string()
        .min(1, "El email es requerido")
        .email("Debe ser un email válido")
        .toLowerCase()
        .optional(),

    active: z.boolean().optional()
});

// Esquema para ID
export const supplierIdSchema = z.object({
    id: z.string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "El ID debe ser un número positivo")
});
