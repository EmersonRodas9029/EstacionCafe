import type { Consumable } from '@/api/generated/model/consumable'
import type { ProductFormInput } from './schemas'

/** Costo de la receta según el costo unitario actual de cada consumible. */
export const recipeCost = (
  lines: ProductFormInput['recipe'] | undefined,
  consumables: Consumable[],
) =>
  (lines ?? []).reduce((total, line) => {
    const consumable = consumables.find((c) => c.consumableId === Number(line.consumableId))
    const quantity = Number(line.quantity)
    return consumable && quantity > 0 ? total + quantity * consumable.cost : total
  }, 0)
