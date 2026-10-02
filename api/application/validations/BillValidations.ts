import { z } from "zod";
import { Status } from "../../core/enums/Status";

export const createBillSchema = z.object({
  cashRegister: z
    .int()
    .refine(
      (val) => !isNaN(val) && val > 0,
      "La caja registradora debe ser un número positivo0",
    ),

  tableId: z
    .string()
    .min(1, "El ID de la mesa es requerido")
    .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
    .trim()
    .optional(),

  total: z
    .number()
    .nonnegative("El total no puede ser negativo")
    .refine(
      (val) => Math.abs(val * 100 - Math.round(val * 100)) < 0.0001,
      "El total debe tener máximo 2 decimales",
    ),
  status: z.nativeEnum(Status).optional(),

  customer: z
    .string()
    .min(1, "El nombre del cliente es requerido")
    .max(100, "El nombre del cliente es muy largo")
    .trim(),

  date: z
    .string()
    .or(z.date())
    .transform((val) => {
      const utcDate = typeof val === "string" ? new Date(val) : val;
      const salvadorDate = new Date(utcDate.getTime() - 6 * 60 * 60 * 1000);
      return salvadorDate;
    })
    .refine((date) => !isNaN(date.getTime()), "La fecha debe ser válida"),
});

export const updateBillSchema = z
  .object({
    cashRegisterId: z
      .number()
      .int("La caja registradora debe ser un número entero")
      .positive("La caja registradora debe ser un número positivo")
      .optional(),

    tableId: z
      .string()
      .min(1, "El ID de la mesa es requerido")
      .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
      .trim()
      .optional(),

    total: z
      .number()
      .nonnegative()
      .refine(
        (val) => Math.abs(val * 100 - Math.round(val * 100)) < 0.0001,
        "El total debe tener máximo 2 decimales",
      )
      .optional(),
    status: z.nativeEnum(Status).optional(),

    customer: z
      .string()
      .min(1, "El nombre del cliente es requerido")
      .max(100, "El nombre del cliente es muy largo")
      .trim()
      .optional(),

    date: z
      .string()
      .or(z.date())
      .transform((val) => {
        const utcDate = typeof val === "string" ? new Date(val) : val;
        const salvadorDate = new Date(utcDate.getTime() - 6 * 60 * 60 * 1000);
        return salvadorDate;
      })
      .refine((date) => !isNaN(date.getTime()), "La fecha debe ser válida")
      .optional(),
  })
  .strict();

export const billIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val > 0,
      "El ID debe ser un número positivo",
    ),
});

export const tableIdSchema = z.object({
  tableId: z
    .string()
    .min(1, "El ID de la mesa es requerido")
    .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
    .trim(),
});

export const billSchema = createBillSchema;
