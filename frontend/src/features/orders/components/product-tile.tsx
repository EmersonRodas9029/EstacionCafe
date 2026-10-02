import { Plus } from 'lucide-react'
import type { Product } from '@/api/generated/model/product'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ProductTile({
  product,
  quantity,
  onAdd,
}: {
  product: Product
  quantity: number
  onAdd: () => void
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Agregar ${product.name}, ${formatCurrency(product.price)}${quantity ? `, ${quantity} en la orden` : ''}`}
      className={cn(
        'relative flex min-h-28 w-full flex-col justify-between rounded-lg border bg-card p-4 text-left shadow-xs transition active:scale-[0.98]',
        quantity > 0 ? 'border-accent ring-2 ring-accent/30' : 'hover:border-primary/30',
      )}
    >
      <span className="pr-8 leading-snug font-semibold text-primary">{product.name}</span>
      <span className="flex items-end justify-between">
        <span className="font-bold text-accent-strong tabular-nums">
          {formatCurrency(product.price)}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'grid size-9 place-items-center rounded-full font-bold tabular-nums',
            quantity > 0 ? 'bg-accent-strong text-accent-foreground' : 'bg-muted text-primary',
          )}
        >
          {quantity > 0 ? quantity : <Plus className="size-4" />}
        </span>
      </span>
    </button>
  )
}
