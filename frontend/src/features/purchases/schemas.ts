import { z } from 'zod'

const number = (required: string) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number({ error: required }))

const positive = (required: string) =>
  number(required).pipe(z.number().positive('Debe ser mayor a 0'))

export const purchaseLineSchema = z.object({
  consumableId: number('Elige un consumible').pipe(
    z.number().int().positive('Elige un consumible'),
  ),
  quantity: positive('Escribe la cantidad'),
  unitCost: positive('Escribe el costo').pipe(
    z
      .number()
      .refine((v) => Math.abs(v * 10000 - Math.round(v * 10000)) < 1e-6, 'Máximo 4 decimales'),
  ),
})

/**
 * Como POST /purchases: con líneas (suma inventario) o un gasto con total,
 * nunca ambos. `mode` decide cuál se envía.
 */
export const purchaseFormSchema = z
  .object({
    date: z.string().min(1, 'Elige la fecha'),
    supplierId: number('Elige un proveedor').pipe(z.number().int().positive('Elige un proveedor')),
    cashRegisterId: z.preprocess(
      (v) => (v === '' || v == null ? undefined : v),
      z.coerce.number().int().positive().optional(),
    ),
    mode: z.enum(['stock', 'expense']),
    details: z.array(purchaseLineSchema),
    total: z.unknown(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === 'stock') {
      if (v.details.length === 0)
        ctx.addIssue({
          code: 'custom',
          path: ['details'],
          message: 'Agrega al menos un consumible',
        })
      const seen = new Set<number>()
      v.details.forEach((line, index) => {
        if (seen.has(line.consumableId))
          ctx.addIssue({
            code: 'custom',
            path: ['details', index, 'consumableId'],
            message: 'Repetido: suma la cantidad en una sola línea',
          })
        seen.add(line.consumableId)
      })
    } else {
      const total = positive('Escribe el total').safeParse(v.total)
      if (!total.success)
        ctx.addIssue({ code: 'custom', path: ['total'], message: total.error.issues[0]!.message })
    }
  })

export type PurchaseFormInput = z.input<typeof purchaseFormSchema>
export type PurchaseFormValues = z.output<typeof purchaseFormSchema>

export const lineSubtotal = (quantity: unknown, unitCost: unknown) => {
  const value = Number(quantity) * Number(unitCost)
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 0
}
