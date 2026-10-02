import { Receipt, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/errors'
import { useGetPurchase } from '@/api/generated/purchases/purchases'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { UNIT_LABEL } from '@/features/inventory/units'
import { formatCurrency, formatDateTime, formatQuantity, formatUnitCost } from '@/lib/format'
import { useRemovePurchase } from '../hooks'

const BACK = '/admin/compras'

export function PurchaseDetailPage() {
  const purchaseId = Number(useParams().purchaseId)
  const valid = Number.isInteger(purchaseId) && purchaseId > 0
  // Pausada mientras se elimina: la invalidación no debe volver a pedir una compra borrada
  const [deleting, setDeleting] = useState(false)
  const purchase = useGetPurchase(purchaseId, {
    query: { enabled: valid && !deleting, select: (r) => r.data },
  })
  const remove = useRemovePurchase()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const title = `Compra #${purchaseId}`

  if (!valid || (purchase.error instanceof ApiError && purchase.error.status === 404))
    return (
      <>
        <PageHeader title="Compra" backTo={BACK} backLabel="Compras" />
        <EmptyState
          icon={Receipt}
          title="Compra no encontrada"
          action={
            <Link to={BACK} className={buttonVariants({ variant: 'outline' })}>
              Ver compras
            </Link>
          }
        />
      </>
    )

  if (purchase.isPending || purchase.isError)
    return (
      <>
        <PageHeader title={title} backTo={BACK} backLabel="Compras" />
        {purchase.isPending ? (
          <Skeleton className="h-72" />
        ) : (
          <ErrorState message="No pudimos cargar la compra." onRetry={() => purchase.refetch()} />
        )}
      </>
    )

  const data = purchase.data
  const details = data.details ?? []

  const confirmDelete = () => {
    setDeleting(true)
    remove.mutate(
      { id: purchaseId },
      {
        onSuccess: () => {
          toast.success(`${title} eliminada`)
          navigate(BACK)
        },
        onError: () => {
          setDeleting(false)
          setConfirming(false)
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={formatDateTime(data.date)}
        backTo={BACK}
        backLabel="Compras"
        actions={
          <Button variant="destructive" onClick={() => setConfirming(true)}>
            <Trash2 /> Eliminar
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden">
          {details.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="font-semibold text-primary">Gasto sin inventario</p>
              <p className="text-muted-foreground">Esta compra no movió stock.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-surface-soft text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="w-full px-4 py-3 font-semibold">
                    Consumible
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Cantidad
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-right font-semibold sm:table-cell"
                  >
                    Costo
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {details.map((d) => {
                  const unit = d.consumable ? UNIT_LABEL[d.consumable.unitMeasurement] : ''
                  return (
                    <tr key={d.purchaseDetailId}>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {d.consumable?.name ?? `Consumible ${d.consumableId}`}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                        {formatQuantity(d.quantity)} {unit}
                      </td>
                      <td className="hidden px-4 py-3 text-right whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">
                        {formatUnitCost(d.unitCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(d.subTotal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div className="flex items-baseline justify-between border-t bg-surface-soft px-4 py-3">
            <span className="font-semibold">Total</span>
            <span className="font-display text-xl font-semibold text-primary tabular-nums">
              {formatCurrency(data.total)}
            </span>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <p className="text-sm text-muted-foreground">Proveedor</p>
            <Link
              to={`/admin/proveedores/${data.supplierId}`}
              className="font-semibold text-primary hover:text-accent-strong"
            >
              {data.supplier?.name ?? `Proveedor ${data.supplierId}`}
            </Link>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pagado desde</p>
            <p className="font-semibold text-primary">
              {data.cashRegister ? `Caja ${data.cashRegister.number}` : 'Fuera de caja'}
            </p>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={confirmDelete}
        title={`¿Eliminar la ${title.toLowerCase()}?`}
        confirmLabel="Eliminar compra"
        destructive
        pending={remove.isPending}
      >
        {details.length
          ? 'Se restará del inventario lo que entró con esta compra. Si ya se consumió, no se podrá eliminar.'
          : 'Se borrará el registro del gasto.'}
      </ConfirmDialog>
    </>
  )
}
