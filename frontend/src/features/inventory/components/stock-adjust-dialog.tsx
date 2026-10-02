import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Consumable } from '@/api/generated/model/consumable'
import { Button } from '@/components/ui/button'
import { ChipGroup } from '@/components/ui/chip-group'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { formatQuantity } from '@/lib/format'
import { useEditConsumable } from '../hooks'
import { adjustedStock, type AdjustMode } from '../schemas'
import { UNIT_LABEL } from '../units'

const MODE_LABEL: Record<AdjustMode, string> = {
  add: 'Sumar',
  remove: 'Restar (merma)',
  set: 'Conteo físico',
}

/**
 * Ajuste manual de stock (mermas, conteos). La API solo acepta la cantidad
 * final, así que el nuevo valor se calcula aquí. Las entradas normales van por Compras.
 */
export function StockAdjustDialog({
  onClose,
  consumable,
}: {
  onClose: () => void
  consumable: Consumable
}) {
  const [mode, setMode] = useState<AdjustMode>('remove')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const edit = useEditConsumable()
  const unit = UNIT_LABEL[consumable.unitMeasurement]
  const next = amount === '' ? null : adjustedStock(consumable.quantity, mode, Number(amount))

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (amount === '') return setError('Escribe la cantidad')
    if (next === null)
      return setError(
        mode === 'remove' ? 'No puedes restar más de lo que hay' : 'Cantidad no válida',
      )
    edit.mutate(
      { id: consumable.consumableId, data: { quantity: next } },
      {
        onSuccess: () => {
          toast.success(`${consumable.name}: ${formatQuantity(next)} ${unit}`)
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Ajustar ${consumable.name}`}
      description={`Stock actual: ${formatQuantity(consumable.quantity)} ${unit}. Para entradas de proveedor usa Compras.`}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <ChipGroup
          label="Tipo de ajuste"
          value={mode}
          onChange={(value) => {
            setMode(value)
            setError(null)
          }}
          options={(Object.keys(MODE_LABEL) as AdjustMode[]).map((value) => ({
            value,
            label: MODE_LABEL[value],
          }))}
        />
        <FormField
          label={mode === 'set' ? `Cantidad contada (${unit})` : `Cantidad (${unit})`}
          error={error ?? undefined}
        >
          {(control) => (
            <Input
              {...control}
              autoFocus
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError(null)
              }}
            />
          )}
        </FormField>
        <p className="rounded-md bg-surface-soft px-4 py-3 text-sm" aria-live="polite">
          Nuevo stock:{' '}
          <strong className="font-display text-lg text-primary tabular-nums">
            {next === null ? '—' : `${formatQuantity(next)} ${unit}`}
          </strong>
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={edit.isPending}>
            Guardar ajuste
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
