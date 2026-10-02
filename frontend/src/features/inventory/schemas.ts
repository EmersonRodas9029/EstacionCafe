import { z } from 'zod'
import { UnitMeasurement } from '@/api/generated/model/unitMeasurement'

const number = (required: string) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number({ error: required }))

const id = (message: string) => number(message).pipe(z.number().int().positive(message))

/** Mismas reglas que POST /consumable; la cantidad inicial solo se pide al crear. */
export const consumableFormSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(255, 'Máximo 255 caracteres'),
  consumableTypeId: id('Elige un tipo'),
  supplierId: id('Elige un proveedor'),
  unitMeasurement: z.enum(Object.values(UnitMeasurement), { error: 'Elige una unidad' }),
  cost: number('Escribe el costo').pipe(
    z
      .number()
      .min(0, 'No puede ser negativo')
      .refine((v) => Math.abs(v * 10000 - Math.round(v * 10000)) < 1e-6, 'Máximo 4 decimales'),
  ),
  minStock: number('Escribe el mínimo').pipe(z.number().min(0, 'No puede ser negativo')),
  quantity: number('Escribe la cantidad').pipe(z.number().min(0, 'No puede ser negativa')),
})

export type ConsumableFormInput = z.input<typeof consumableFormSchema>
export type ConsumableFormValues = z.output<typeof consumableFormSchema>

export type AdjustMode = 'add' | 'remove' | 'set'

/** Nuevo stock según el tipo de ajuste; null si el resultado no es válido. */
export const adjustedStock = (current: number, mode: AdjustMode, amount: number) => {
  if (!Number.isFinite(amount) || amount < 0) return null
  const next = mode === 'add' ? current + amount : mode === 'remove' ? current - amount : amount
  return next < 0 ? null : Math.round(next * 1000) / 1000
}
