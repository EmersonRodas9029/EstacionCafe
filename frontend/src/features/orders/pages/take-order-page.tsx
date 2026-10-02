import { Search, Send, ShoppingBasket } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/errors'
import { useGetBill } from '@/api/generated/bills/bills'
import { useListProductTypes } from '@/api/generated/product-types/product-types'
import { useListActiveProducts } from '@/api/generated/products/products'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ChipGroup } from '@/components/ui/chip-group'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { isEditable } from '@/features/bills/bill-status'
import { errorMessage } from '@/lib/errors'
import { formatCurrency } from '@/lib/format'
import { useCart, useCartStore } from '../cart-store'
import { CartSummary, type CartLine } from '../components/cart-summary'
import { ProductTile } from '../components/product-tile'
import { useSendOrder } from '../hooks/use-send-order'

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export function TakeOrderPage() {
  const billId = Number(useParams().billId)
  const navigate = useNavigate()
  const [category, setCategory] = useState('todas')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [sheetOpen, setSheetOpen] = useState(false)

  const bill = useGetBill(billId, { query: { select: (r) => r.data } })
  const products = useListActiveProducts({ query: { select: (r) => r.data } })
  const types = useListProductTypes({ query: { select: (r) => r.data } })
  const quantities = useCart(billId)
  const { add, setQuantity, clear } = useCartStore.getState()
  const sendOrder = useSendOrder()

  const catalog = products.data ?? []
  const term = normalize(deferredSearch.trim())
  const visible = catalog.filter(
    (p) =>
      (category === 'todas' || String(p.productTypeId) === category) &&
      (!term || normalize(p.name).includes(term)),
  )
  const cartLines: CartLine[] = catalog
    .filter((p) => quantities[p.productId])
    .map((product) => ({ product, quantity: quantities[product.productId]! }))
  const itemsCount = cartLines.reduce((acc, l) => acc + l.quantity, 0)
  const cartTotal = cartLines.reduce((acc, l) => acc + l.product.price * l.quantity, 0)

  const send = () =>
    sendOrder.mutate(
      {
        data: {
          billId,
          billDetails: cartLines.map((l) => ({
            productId: l.product.productId,
            quantity: l.quantity,
          })),
        },
      },
      {
        onSuccess: () => {
          clear(billId)
          toast.success(
            `Orden enviada (${itemsCount} ${itemsCount === 1 ? 'producto' : 'productos'})`,
          )
          navigate(`/mesero/cuentas/${billId}`)
        },
        onError: (error) =>
          toast.error(
            error instanceof ApiError && error.isStockError
              ? `${error.message}. Ajusta la orden.`
              : errorMessage(error),
          ),
      },
    )

  if (bill.isError)
    return <ErrorState message="No encontramos la cuenta." onRetry={() => bill.refetch()} />
  if (bill.data && !isEditable(bill.data.status)) {
    return <ErrorState message="Esta cuenta ya está cerrada; no se le pueden agregar productos." />
  }

  const sendButton = (
    <Button
      variant="accent"
      size="lg"
      className="w-full"
      disabled={itemsCount === 0 || sendOrder.isPending}
      onClick={send}
    >
      <Send /> Enviar {itemsCount > 0 ? `· ${formatCurrency(cartTotal)}` : ''}
    </Button>
  )

  return (
    <>
      <PageHeader
        backTo={`/mesero/cuentas/${billId}`}
        backLabel="Cuenta"
        title="Tomar orden"
        subtitle={
          bill.data
            ? `${bill.data.customer}${bill.data.tableId ? ` · Mesa ${bill.data.tableId}` : ' · Para llevar'}`
            : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Buscar producto"
              placeholder="Buscar producto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>
          <ChipGroup
            label="Categoría"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'todas', label: 'Todo' },
              ...(types.data ?? []).map((t) => ({ value: String(t.productTypeId), label: t.name })),
            ]}
          />

          {products.isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : products.isError ? (
            <ErrorState message="No pudimos cargar el menú." onRetry={() => products.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              description="Prueba otra búsqueda o categoría."
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <li key={product.productId}>
                  <ProductTile
                    product={product}
                    quantity={quantities[product.productId] ?? 0}
                    onAdd={() => add(billId, product.productId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Escritorio: orden siempre visible */}
        <aside
          aria-label="Orden"
          className="sticky top-6 hidden space-y-4 rounded-lg border bg-card p-5 shadow-md lg:block"
        >
          <h2 className="font-display text-xl font-semibold text-primary">Orden nueva</h2>
          <CartSummary lines={cartLines} onQuantity={(id, q) => setQuantity(billId, id, q)} />
          {sendButton}
        </aside>
      </div>

      {/* Móvil/tablet: barra con resumen que abre la orden */}
      {itemsCount > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
          <Button
            variant="accent"
            size="lg"
            className="w-full justify-between"
            onClick={() => setSheetOpen(true)}
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBasket /> Ver orden ({itemsCount})
            </span>
            <span className="tabular-nums">{formatCurrency(cartTotal)}</span>
          </Button>
        </div>
      ) : null}
      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Orden nueva"
        footer={sendButton}
      >
        <CartSummary lines={cartLines} onQuantity={(id, q) => setQuantity(billId, id, q)} />
      </Dialog>
    </>
  )
}
