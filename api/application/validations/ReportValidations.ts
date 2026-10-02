import { z } from "zod";

const dateField = z.coerce
  .date<Date>("La fecha debe ser válida")
  .refine((date) => !isNaN(date.getTime()), "La fecha debe ser válida");

export const salesReportSchema = z
  .object({
    from: dateField,
    to: dateField,
    top: z.coerce.number<number>().int().min(1).max(50).optional(),
  })
  .refine((q) => q.from <= q.to, {
    path: ["to"],
    message: "to debe ser posterior a from",
  });
