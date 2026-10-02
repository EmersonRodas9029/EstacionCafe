import { useState } from 'react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'

/** Efectivo recibido → cambio. Solo ayuda visual; no se guarda. */
export function ChangeCalculator({ total }: { total: number }) {
  const [received, setReceived] = useState('')
  const amount = Number(received.replace(',', '.'))
  const change = received && !Number.isNaN(amount) ? amount - total : null

  return (
    <div className="grid grid-cols-2 items-end gap-3">
      <FormField label="Efectivo recibido (opcional)">
        {(control) => (
          <Input
            {...control}
            inputMode="decimal"
            placeholder="0.00"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
          />
        )}
      </FormField>
      <div className="rounded-md bg-surface-soft px-3 py-2.5" aria-live="polite">
        <p className="text-xs font-semibold text-muted-foreground">Cambio</p>
        <p
          className={
            change !== null && change < 0
              ? 'text-lg font-bold text-destructive tabular-nums'
              : 'text-lg font-bold text-primary tabular-nums'
          }
        >
          {change === null
            ? '—'
            : change < 0
              ? `Faltan ${formatCurrency(-change)}`
              : formatCurrency(change)}
        </p>
      </div>
    </div>
  )
}
