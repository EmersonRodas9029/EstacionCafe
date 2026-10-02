import { z } from "zod";

const quantityField = z
  .number("La cantidad debe ser un número")
  .int("La cantidad debe ser un número entero")
  .positive("La cantidad debe ser mayor a 0")
  .max(999, "La cantidad es demasiado alta");

/**
 * Cada línea solo necesita producto y cantidad: nombre, precio y subtotal
 * los calcula el servidor (campos extra del cliente se ignoran).
 */
export const billDetailItemSchema = z.object({
  productId: z
    .number("El ID del producto debe ser un número")
    .int("El ID del producto debe ser un número entero")
    .positive("El ID del producto debe ser un número positivo"),
  quantity: quantityField,
});

export const BillDetailsSchema = z.object({
  billId: z
    .number("El ID del bill debe ser un número")
    .int("El ID del bill debe ser un número entero")
    .positive("El ID del bill debe ser un número positivo"),

  billDetails: z
    .array(billDetailItemSchema)
    .min(1, "Debe incluir al menos un detalle de factura"),
});

export const updateBillDetailSchema = z.object({
  quantity: quantityField,
});

export const billDetailIdSchema = z.object({
  id: z.coerce
    .number<number>()
    .int("El ID debe ser un número entero")
    .positive("El ID debe ser un número positivo"),
});
