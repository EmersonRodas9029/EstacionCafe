import { Pencil, Plus, Search, Tags, UtensilsCrossed } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useListProductTypes } from '@/api/generated/product-types/product-types'
import { useListProducts } from '@/api/generated/products/products'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { ChipGroup } from '@/components/ui/chip-group'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { formatCurrency, marginPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CategoriesDialog } from '../components/categories-dialog'
import { ActiveToggle } from '../components/active-toggle'

type StatusFilter = 'active' | 'inactive' | 'all'

/** Por debajo de este margen el precio probablemente no cubre gastos indirectos. */
const LOW_MARGIN = 50

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export function ProductsPage() {
  const products = useListProducts({ query: { select: (r) => r.data } })
  const categories = useListProductTypes({ query: { select: (r) => r.data } })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  const all = useMemo(() => products.data ?? [], [products.data])
  const categoryName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.productTypeId, c.name])),
    [categories.data],
  )

  const visible = useMemo(() => {
    const query = normalize(search.trim())
    return all.filter(
      (p) =>
        (status === 'all' || p.active === (status === 'active')) &&
        (category === 'all' || p.productTypeId === Number(category)) &&
        (!query || normalize(`${p.name} ${p.description}`).includes(query)),
    )
  }, [all, search, category, status])

  const activeCount = all.filter((p) => p.active).length

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle={
          products.data
            ? `${activeCount} activos de ${all.length} · ${categories.data?.length ?? 0} categorías`
            : 'Menú, precios y recetas'
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
              <Tags /> Categorías
            </Button>
            <Link to="/admin/productos/nuevo" className={buttonVariants({ variant: 'accent' })}>
              <Plus /> Nuevo producto
            </Link>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar producto"
            placeholder="Buscar producto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="lg:w-56">
          <Select
            aria-label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.productTypeId} value={c.productTypeId}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <ChipGroup
          label="Estado"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'Activos', count: activeCount },
            { value: 'inactive', label: 'Inactivos', count: all.length - activeCount },
            { value: 'all', label: 'Todos', count: all.length },
          ]}
        />
      </div>

      {products.isPending ? (
        <Skeleton className="h-72" />
      ) : products.isError ? (
        <ErrorState message="No pudimos cargar los productos." onRetry={() => products.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={all.length === 0 ? 'Aún no hay productos' : 'Sin resultados'}
          description={
            all.length === 0
              ? 'Crea el primero para que aparezca en el menú del mesero.'
              : 'Prueba con otra búsqueda o filtro.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-soft text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="w-full px-4 py-3 font-semibold">
                  Producto
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Precio
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">
                  Costo
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">
                  Margen
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((product) => {
                const margin = marginPercent(product.price, product.cost)
                return (
                  <tr key={product.productId} className={cn(!product.active && 'bg-muted/40')}>
                    <td className="max-w-0 px-4 py-3">
                      <Link
                        to={`/admin/productos/${product.productId}`}
                        className="block truncate font-semibold text-primary hover:text-accent-strong"
                      >
                        {product.name}
                      </Link>
                      <p className="truncate text-muted-foreground">{product.description}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {categoryName.get(product.productTypeId ?? 0) ?? 'Sin categoría'}
                        {product.active ? '' : ' · Inactivo'}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap md:table-cell">
                      {categoryName.get(product.productTypeId ?? 0) ?? (
                        <span className="text-muted-foreground">Sin categoría</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-muted-foreground tabular-nums sm:table-cell">
                      {formatCurrency(product.cost)}
                    </td>
                    <td
                      className={cn(
                        'hidden px-4 py-3 text-right font-semibold tabular-nums sm:table-cell',
                        margin < LOW_MARGIN ? 'text-accent-strong' : 'text-status-available',
                      )}
                    >
                      {margin}%
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <Badge tone={product.active ? 'available' : 'neutral'}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-1">
                        <ActiveToggle product={product} className="hidden sm:inline-flex" />
                        <Link
                          to={`/admin/productos/${product.productId}`}
                          aria-label={`Editar ${product.name}`}
                          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                        >
                          <Pencil />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <CategoriesDialog
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={categories.data ?? []}
        products={all}
      />
    </>
  )
}
