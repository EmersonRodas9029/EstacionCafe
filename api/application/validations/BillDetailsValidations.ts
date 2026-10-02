import { z } from "zod";

export const billDetailItemSchema = z.object({
  productId: z
    .number()
    .int("El ID del producto debe ser un número entero")
    .positive("El ID del producto debe ser un número positivo"),
  name: z
    .string()
    .min(1, "El nombre del producto es requerido")
    .max(100, "El nombre del producto es muy largo"),
  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  price: z
    .number()
    .positive("El precio debe ser mayor a 0")
    .refine(
      (val) => Math.abs(val * 100 - Math.round(val * 100)) < 0.0001,
      "El precio debe tener máximo 2 decimales",
    ),
  subTotal: z
    .number()
    .nonnegative("El subtotal no puede ser negativo")
    .refine(
      (val) => Math.abs(val * 100 - Math.round(val * 100)) < 0.0001,
      "El subtotal debe tener máximo 2 decimales",
    ),
});

export const BillDetailsSchema = z.object({
  billId: z
    .number()
    .int("El ID del bill debe ser un número entero")
    .positive("El ID del bill debe ser un número positivo"),

  billDetails: z
    .array(billDetailItemSchema)
    .min(1, "Debe incluir al menos un detalle de factura"),
});
