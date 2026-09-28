"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillDetailsSchema = exports.billDetailItemSchema = void 0;
const zod_1 = require("zod");
exports.billDetailItemSchema = zod_1.z.object({
    productId: zod_1.z
        .number()
        .int("El ID del producto debe ser un número entero")
        .positive("El ID del producto debe ser un número positivo"),
    name: zod_1.z
        .string()
        .min(1, "El nombre del producto es requerido")
        .max(100, "El nombre del producto es muy largo"),
    quantity: zod_1.z
        .number()
        .int("La cantidad debe ser un número entero")
        .positive("La cantidad debe ser mayor a 0"),
    price: zod_1.z
        .number()
        .positive("El precio debe ser mayor a 0")
        .refine((val) => Math.abs(val * 100 - Math.round(val * 100)) < 0.0001, "El precio debe tener máximo 2 decimales"),
    subTotal: zod_1.z
        .number()
        .nonnegative("El subtotal no puede ser negativo")
        .refine((val) => Math.abs(val * 100 - Math.round(val * 100)) < 0.0001, "El subtotal debe tener máximo 2 decimales"),
});
exports.BillDetailsSchema = zod_1.z.object({
    billId: zod_1.z
        .number()
        .int("El ID del bill debe ser un número entero")
        .positive("El ID del bill debe ser un número positivo"),
    billDetails: zod_1.z
        .array(exports.billDetailItemSchema)
        .min(1, "Debe incluir al menos un detalle de factura"),
});
