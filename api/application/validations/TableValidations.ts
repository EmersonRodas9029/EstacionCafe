import { z } from "zod";
import { TableStatus } from "../../core/entities/Table";

export const createTableSchema = z.object({
  tableId: z
    .string()
    .min(1, "El ID de la mesa es requerido")
    .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
    .regex(
      /^[A-Z0-9]+$/,
      "El ID de la mesa debe contener solo letras mayúsculas y números",
    )
    .trim(),

  zone: z
    .string()
    .min(1, "La zona es requerida")
    .max(50, "La zona no puede tener más de 50 caracteres")
    .trim(),

  status: z.nativeEnum(TableStatus).optional().default(TableStatus.DISPONIBLE),
});

export const updateTableSchema = z.object({
  zone: z
    .string()
    .min(1, "La zona es requerida")
    .max(50, "La zona no puede tener más de 50 caracteres")
    .trim()
    .optional(),

  status: z.nativeEnum(TableStatus).optional(),
});

export const tableIdSchema = z.object({
  id: z
    .string()
    .min(1, "El ID de la mesa es requerido")
    .max(10, "El ID de la mesa no puede tener más de 10 caracteres")
    .trim(),
});

export const tableSchema = createTableSchema;
