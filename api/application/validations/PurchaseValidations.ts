import { z } from "zod";

const id = (message: string) =>
  z.coerce.number<number>().int(message).positive(message);

const dateField = z.coerce
  .date<Date>("La fecha debe ser válida")
  .refine((date) => !isNaN(date.getTime()), "La fecha debe ser válida");

const money = (message: string) =>
  z.coerce
    .number<number>()
    .positive(message)
    .transform((val) => Math.round(val * 100) / 100);

export const purchaseDetailSchema = z.object({
  consumableId: id("El consumible debe ser un ID válido"),
  quantity: z.coerce.number<number>().positive("La cantidad debe ser mayor a 0"),
  // Costo por unidad de medida (g, ml…): admite 4 decimales como la columna
  unitCost: z.coerce
    .number<number>()
    .positive("El costo unitario debe ser mayor a 0")
    .transform((val) => Math.round(val * 10000) / 10000),
});

export const createPurchaseSchema = z
  .object({
    date: dateField,
    supplierId: id("El proveedor debe ser un ID válido"),
    cashRegisterId: id("La caja registradora debe ser un ID válido").optional(),
    details: z.array(purchaseDetailSchema).min(1).optional(),
    total: money("El total debe ser mayor a 0").optional(),
  })
  .refine((p) => p.details || p.total, {
    path: ["details"],
    message: "Envía details (con inventario) o total (gasto sin inventario)",
  })
  .refine((p) => !(p.details && p.total), {
    path: ["total"],
    message: "Con details el total se calcula automáticamente",
  });

export const updatePurchaseSchema = z
  .object({
    date: dateField.optional(),
    cashRegisterId: id("La caja registradora debe ser un ID válido").optional(),
    supplierId: id("El proveedor debe ser un ID válido").optional(),
    total: money("El total debe ser mayor a 0").optional(),
  })
  .strict();

export const purchaseIdSchema = z.object({
  id: id("El ID debe ser un número positivo"),
});
