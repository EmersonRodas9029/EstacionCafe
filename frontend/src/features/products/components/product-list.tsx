import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/format'
import { activeProductsQuery } from '../api'

export function ProductList() {
  const { data, isPending, isError, error } = useQuery(activeProductsQuery())

  if (isPending) return <p className="text-muted-foreground">Cargando productos…</p>
  if (isError)
    return (
      <p role="alert" className="text-destructive">
        {error.message}
      </p>
    )
  if (data.length === 0) return <p className="text-muted-foreground">No hay productos activos.</p>

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((product) => (
        <li key={product.productId} className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="font-semibold text-primary">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <p className="mt-2 font-bold text-accent-strong">{formatCurrency(product.price)}</p>
        </li>
      ))}
    </ul>
  )
}
