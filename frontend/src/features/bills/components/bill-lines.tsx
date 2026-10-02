import { Trash2 } from 'lucide-react'
import type { BillDetailLine } from '@/api/generated/model/billDetailLine'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { formatCurrency } from '@/lib/format'

type Props = {
  lines: BillDetailLine[]
  editable: boolean
  onQuantity: (line: BillDetailLine, quantity: number) => void
  onRemove: (line: BillDetailLine) => void
}

export function BillLines({ lines, editable, onQuantity, onRemove }: Props) {
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {lines.map((line) => (
        <li
          key={line.billDetailId}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-primary">{line.name}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(line.price)} c/u
            </p>
          </div>
          {editable ? (
            <QuantityStepper
              label={line.name}
              value={line.quantity}
              onChange={(quantity) => onQuantity(line, quantity)}
            />
          ) : (
            <span className="font-semibold tabular-nums">× {line.quantity}</span>
          )}
          <p className="w-20 text-right font-bold text-primary tabular-nums">
            {formatCurrency(line.subTotal)}
          </p>
          {editable ? (
            <button
              type="button"
              onClick={() => onRemove(line)}
              aria-label={`Quitar ${line.name}`}
              className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-5" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
