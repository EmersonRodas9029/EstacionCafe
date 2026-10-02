import { z } from "zod";
import { Status } from "../../core/enums/Status";
import { OrderType } from "../../core/enums/OrderType";
import { PaymentMethod } from "../../core/enums/PaymentMethod";

const paymentMethodField = z.nativeEnum(PaymentMethod, "El método de pago debe ser cash o card");

const positiveInt = (message: string) =>
  z.coerce.number<number>().int(message).positive(message);

const tableIdField = z
  .string()
  .trim()
  .min(1, "El ID de la mesa es requerido")
  .max(10, "El ID de la mesa no puede tener más de 10 caracteres");

const dateField = z.coerce
  .date<Date>("La fecha debe ser válida")
  .refine((date) => !isNaN(date.getTime()), "La fecha debe ser válida");

export const createBillSchema = z
  .object({
    customer: z
      .string()
      .trim()
      .min(1, "El nombre del cliente es requerido")
      .max(100, "El nombre del cliente es muy largo"),
    tableId: tableIdField.optional(),
    orderType: z.nativeEnum(OrderType).optional(),
    status: z.nativeEnum(Status).optional(),
    cashRegisterId: positiveInt(
      "La caja registradora debe ser un número positivo",
    ).optional(),
    date: dateField.optional(),
  })
  .transform((bill) => ({
    ...bill,
    // Sin orderType explícito: con mesa = en mesa, sin mesa = para llevar
    orderType:
      bill.orderType ?? (bill.tableId ? OrderType.DINE_IN : OrderType.TAKEAWAY),
  }))
  .superRefine((bill, ctx) => {
    if (bill.orderType === OrderType.DINE_IN && !bill.tableId) {
      ctx.addIssue({
        code: "custom",
        path: ["tableId"],
        message: "Una cuenta en mesa requiere tableId",
      });
    }
    if (bill.orderType === OrderType.TAKEAWAY && bill.tableId) {
      ctx.addIssue({
        code: "custom",
        path: ["tableId"],
        message: "Una orden para llevar no lleva mesa",
      });
    }
  });

export const updateBillSchema = z
  .object({
    customer: z
      .string()
      .trim()
      .min(1, "El nombre del cliente es requerido")
      .max(100, "El nombre del cliente es muy largo")
      .optional(),
    // Mover la cuenta a otra mesa
    tableId: tableIdField.optional(),
    status: z.nativeEnum(Status).optional(),
    cashRegisterId: positiveInt(
      "La caja registradora debe ser un número positivo",
    ).optional(),
    paymentMethod: paymentMethodField.optional(),
    date: dateField.optional(),
  })
  .strict();

export const billIdSchema = z.object({
  id: positiveInt("El ID debe ser un número positivo"),
});

export const tableIdSchema = z.object({
  tableId: tableIdField,
});

export const closeTableBillsSchema = z.object({
  cashRegisterId: positiveInt(
    "La caja registradora debe ser un número positivo",
  ),
  paymentMethod: paymentMethodField,
});

/** Filtros de GET /bills. page/limit activan la paginación. */
export const billFiltersSchema = z.object({
  status: z.nativeEnum(Status).optional(),
  orderType: z.nativeEnum(OrderType).optional(),
  tableId: tableIdField.optional(),
  waiterId: positiveInt("waiterId inválido").optional(),
  mine: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  from: dateField.optional(),
  to: dateField.optional(),
  page: positiveInt("page inválido").optional(),
  limit: z.coerce.number<number>().int().min(1).max(200).optional(),
});

export const billSchema = createBillSchema;
