import { Banknote, CreditCard } from 'lucide-react'
import type { PaymentMethod } from '@/api/generated/model/paymentMethod'
import { cn } from '@/lib/utils'
import { PAYMENT_LABEL } from '../bill-status'

const ICON = { cash: Banknote, card: CreditCard } as const

/** Efectivo o tarjeta: dos botones grandes, fáciles de tocar en caja. */
export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}) {
  return (
    <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-2 gap-3">
      {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((method) => {
        const Icon = ICON[method]
        const selected = value === method
        return (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(method)}
            className={cn(
              'flex h-16 items-center justify-center gap-2 rounded-lg border-2 text-base font-semibold transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-primary hover:border-primary/40',
            )}
          >
            <Icon className="size-6" aria-hidden="true" /> {PAYMENT_LABEL[method]}
          </button>
        )
      })}
    </div>
  )
}
