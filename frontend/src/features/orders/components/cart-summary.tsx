import type { Product } from '@/api/generated/model/product'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { formatCurrency } from '@/lib/format'

export type CartLine = { product: Product; quantity: number }

export function CartSummary({
  lines,
  onQuantity,
}: {
  lines: CartLine[]
  onQuantity: (productId: number, quantity: number) => void
}) {
  if (lines.length === 0) {
    return (
      <p className="py-6 text-center text-muted-foreground">Toca un producto para agregarlo.</p>
    )
  }

  return (
    <ul className="divide-y">
      {lines.map(({ product, quantity }) => (
        <li key={product.productId} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-primary">{product.name}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(product.price * quantity)}
            </p>
          </div>
          <QuantityStepper
            label={product.name}
            value={quantity}
            min={0}
            onChange={(q) => onQuantity(product.productId, q)}
          />
        </li>
      ))}
    </ul>
  )
}
