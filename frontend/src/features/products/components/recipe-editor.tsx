import { Calculator, FlaskConical, Plus, Trash2 } from 'lucide-react'
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form'
import type { Consumable } from '@/api/generated/model/consumable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { UNIT_LABEL } from '@/features/inventory/units'
import { formatCurrency } from '@/lib/format'
import { recipeCost } from '../recipe-cost'
import type { ProductFormInput, ProductFormValues } from '../schemas'

type RecipeEditorProps = {
  control: Control<ProductFormInput, unknown, ProductFormValues>
  register: UseFormRegister<ProductFormInput>
  errors: FieldErrors<ProductFormInput>
  consumables: Consumable[]
  onUseCost: (cost: number) => void
}

export function RecipeEditor({
  control,
  register,
  errors,
  consumables,
  onUseCost,
}: RecipeEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'recipe' })
  const lines = useWatch({ control, name: 'recipe' })
  const total = recipeCost(lines, consumables)
  const rounded = Math.round(total * 100) / 100

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-primary/25 px-4 py-8 text-center">
          <FlaskConical className="size-8 text-accent" aria-hidden="true" />
          <p className="font-semibold text-primary">Sin receta</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Sin ingredientes el producto se vende sin descontar inventario.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const line = lines?.[index]
            const consumable = consumables.find(
              (c) => c.consumableId === Number(line?.consumableId),
            )
            const quantity = Number(line?.quantity)
            const lineErrors = errors.recipe?.[index]
            const position = index + 1
            return (
              <li
                key={field.id}
                className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-2 rounded-md border bg-background/60 p-3 sm:grid-cols-[1fr_9rem_auto]"
              >
                <div className="col-span-2 space-y-1 sm:col-span-1">
                  <Select
                    aria-label={`Consumible del ingrediente ${position}`}
                    aria-invalid={lineErrors?.consumableId ? true : undefined}
                    {...register(`recipe.${index}.consumableId`)}
                  >
                    <option value="">Elige un consumible</option>
                    {consumables
                      .filter((c) => c.active || c.consumableId === Number(line?.consumableId))
                      .map((c) => (
                        <option key={c.consumableId} value={c.consumableId}>
                          {c.name} ({UNIT_LABEL[c.unitMeasurement]}){c.active ? '' : ' — inactivo'}
                        </option>
                      ))}
                  </Select>
                  {lineErrors?.consumableId ? (
                    <p className="text-sm text-destructive">{lineErrors.consumableId.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      aria-label={`Cantidad del ingrediente ${position}`}
                      aria-invalid={lineErrors?.quantity ? true : undefined}
                      className="pr-14 text-right tabular-nums"
                      {...register(`recipe.${index}.quantity`)}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                      {consumable ? UNIT_LABEL[consumable.unitMeasurement] : ''}
                    </span>
                  </div>
                  {lineErrors?.quantity ? (
                    <p className="text-sm text-destructive">{lineErrors.quantity.message}</p>
                  ) : null}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Quitar ingrediente ${position}`}
                  onClick={() => remove(index)}
                  className="mt-0.5 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 />
                </Button>
                {consumable && quantity > 0 ? (
                  <p className="col-span-full text-xs text-muted-foreground">
                    {formatCurrency(quantity * consumable.cost)} · {consumable.quantity}{' '}
                    {UNIT_LABEL[consumable.unitMeasurement]} en inventario
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => append({ consumableId: '', quantity: '' })}
        disabled={consumables.length === 0}
      >
        <Plus /> Agregar ingrediente
      </Button>
      {consumables.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Registra consumibles en Inventario para armar recetas.
        </p>
      ) : null}

      {fields.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-soft px-4 py-3">
          <div>
            <p className="text-sm text-muted-foreground">Costo estimado de la receta</p>
            <p className="font-display text-xl font-semibold text-primary tabular-nums">
              {formatCurrency(total)}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={rounded <= 0}
            onClick={() => onUseCost(rounded)}
          >
            <Calculator /> Usar como costo
          </Button>
        </div>
      ) : null}
    </div>
  )
}
