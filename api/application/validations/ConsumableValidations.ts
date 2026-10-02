import { z } from "zod";
import { UnitMeasurement } from "../../core/enums/UnitMeasurement";

export const ConsumableSchema = z.object({
    supplierId: z
        .union([
            z.string().transform((val) => parseInt(val, 10)),
            z.number().int("El ID del proveedor debe ser un número entero"),
        ])
        .refine(
            (val) => !isNaN(val) && val > 0,
            "El ID del proveedor debe ser un número positivo"
        ),

    name: z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim(),

    cosumableTypeId: z
        .union([
            z.string().transform((val) => parseInt(val, 10)),
            z.number().int("El ID del tipo de consumible debe ser un número entero"),
        ])
        .refine(
            (val) => !isNaN(val) && val >= 0,
            "El ID del tipo de consumible no puede ser negativo"
        ),

    quantity: z
        .union([z.string().transform((val) => parseFloat(val)), z.number()])
        .refine(
            (val) => !isNaN(val) && val >= 0,
            "La cantidad no puede ser negativa"
        ),

    unitMeasurement: z.nativeEnum(UnitMeasurement),

    cost: z
        .union([z.string().transform((val) => parseFloat(val)), z.number()])
        .refine((val) => !isNaN(val) && val >= 0, "El costo no puede ser negativo"),
});

export const createConsumableSchema = ConsumableSchema;

export const updateConsumableSchema = z.object({
    supplierId: z
        .union([
            z.string().transform((val) => parseInt(val, 10)),
            z.number().int("El ID del proveedor debe ser un número entero"),
        ])
        .refine(
            (val) => !isNaN(val) && val > 0,
            "El ID del proveedor debe ser un número positivo"
        )
        .optional(),

    name: z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim()
        .optional(),

    cosumableTypeId: z
        .union([
            z.string().transform((val) => parseInt(val, 10)),
            z.number().int("El ID del tipo de consumible debe ser un número entero"),
        ])
        .refine(
            (val) => !isNaN(val) && val >= 0,
            "El ID del tipo de consumible no puede ser negativo"
        )
        .optional(),

    quantity: z
        .union([z.string().transform((val) => parseFloat(val)), z.number()])
        .refine(
            (val) => !isNaN(val) && val >= 0,
            "La cantidad no puede ser negativa"
        )
        .optional(),

    unitMeasurement: z.nativeEnum(UnitMeasurement).optional(),

    cost: z
        .union([z.string().transform((val) => parseFloat(val)), z.number()])
        .refine((val) => !isNaN(val) && val >= 0, "El costo no puede ser negativo")
        .optional(),
});

export const consumableIdSchema = z.object({
    id: z
        .union([
            z.string().transform((val) => parseInt(val, 10)),
            z.number().int("El ID debe ser un número entero"),
        ])
        .refine(
            (val) => !isNaN(val) && val > 0,
            "El ID debe ser un número positivo"
        ),
});

export const ConsumableTypeSchema = z.object({
    name: z
        .string()
        .min(1, "El nombre es requerido")
        .max(255, "El nombre no puede exceder 255 caracteres")
        .trim(),
});

export type ConsumableInput = z.infer<typeof ConsumableSchema>;