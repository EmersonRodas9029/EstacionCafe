import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
  disabled?: boolean
  className?: string
}

/** − cantidad + con áreas táctiles de 44px. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  disabled,
  className,
}: QuantityStepperProps) {
  const button =
    'grid size-11 place-items-center rounded-md text-primary transition-colors hover:bg-muted disabled:opacity-40'

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center rounded-lg border bg-card', className)}
    >
      <button
        type="button"
        className={button}
        aria-label={`Quitar uno de ${label}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-4" />
      </button>
      <output aria-live="polite" className="min-w-8 text-center font-bold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={button}
        aria-label={`Agregar uno de ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
