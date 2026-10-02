import { Ban, ExternalLink, FileSearch, Pencil, Printer } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/errors'
import { useListBillDetailsByBill } from '@/api/generated/bill-details/bill-details'
import { useGetBill } from '@/api/generated/bills/bills'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { BILL_STATUS, isEditable } from '@/features/bills/bill-status'
import { RenameBillDialog } from '@/features/bills/components/rename-bill-dialog'
import { useCancelBill } from '@/features/bills/hooks/use-bill-actions'
import { formatCurrency, formatDateTime } from '@/lib/format'

const BACK = '/admin/facturas'

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-primary">{value}</dd>
    </div>
  )
}

export function InvoiceDetailPage() {
  const billId = Number(useParams().billId)
  const valid = Number.isInteger(billId) && billId > 0
  const bill = useGetBill(billId, { query: { enabled: valid, select: (r) => r.data } })
  const lines = useListBillDetailsByBill(billId, {
    query: { enabled: valid, select: (r) => r.data },
  })
  const cancel = useCancelBill()
  const [dialog, setDialog] = useState<'rename' | 'void' | null>(null)

  if (!valid || (bill.error instanceof ApiError && bill.error.status === 404))
    return (
      <>
        <PageHeader title="Factura" backTo={BACK} backLabel="Facturas" />
        <EmptyState
          icon={FileSearch}
          title="Factura no encontrada"
          action={
            <Link to={BACK} className={buttonVariants({ variant: 'outline' })}>
              Ver facturas
            </Link>
          }
        />
      </>
    )

  if (bill.isPending)
    return (
      <>
        <PageHeader title={`Factura #${billId}`} backTo={BACK} backLabel="Facturas" />
        <Skeleton className="h-80" />
      </>
    )

  if (bill.isError)
    return (
      <>
        <PageHeader title={`Factura #${billId}`} backTo={BACK} backLabel="Facturas" />
        <ErrorState message="No pudimos cargar la factura." onRetry={() => bill.refetch()} />
      </>
    )

  const data = bill.data
  const status = BILL_STATUS[data.status]
  const active = isEditable(data.status)
  const voided = data.status === 'void'

  const confirmVoid = () =>
    cancel.mutate(
      { id: billId },
      {
        onSuccess: () => {
          toast.success(`Factura #${billId} anulada`)
          setDialog(null)
        },
      },
    )

  return (
    <>
      <PageHeader
        title={`Factura #${billId}`}
        subtitle={<Badge tone={status.tone}>{status.label}</Badge>}
        backTo={BACK}
        backLabel="Facturas"
        actions={
          <>
            <Link
              to={`/mesero/cuentas/${billId}/ticket`}
              className={buttonVariants({ variant: 'outline' })}
            >
              <Printer /> {active ? 'Pre-cuenta' : 'Ticket'}
            </Link>
            {active ? (
              <Link
                to={`/mesero/cuentas/${billId}`}
                className={buttonVariants({ variant: 'outline' })}
              >
                <ExternalLink /> Abrir en operación
              </Link>
            ) : null}
            {!voided ? (
              <>
                <Button variant="outline" onClick={() => setDialog('rename')}>
                  <Pencil /> Renombrar
                </Button>
                <Button variant="destructive" onClick={() => setDialog('void')}>
                  <Ban /> Anular
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden">
          {lines.isPending ? (
            <Skeleton className="m-5 h-40" />
          ) : lines.isError ? (
            <div className="p-5">
              <ErrorState message="No pudimos cargar las líneas." onRetry={() => lines.refetch()} />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-surface-soft text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="w-full px-4 py-3 font-semibold">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Cant.
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-right font-semibold sm:table-cell"
                  >
                    Precio
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lines.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Sin productos.
                    </td>
                  </tr>
                ) : (
                  lines.data.map((line) => (
                    <tr key={line.billDetailId}>
                      <td className="px-4 py-3 font-semibold text-primary">{line.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{line.quantity}</td>
                      <td className="hidden px-4 py-3 text-right text-muted-foreground tabular-nums sm:table-cell">
                        {formatCurrency(line.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(line.subTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="border-t bg-surface-soft">
                <tr>
                  <th
                    scope="row"
                    colSpan={2}
                    className="px-4 py-3 text-left font-semibold sm:hidden"
                  >
                    Total
                  </th>
                  <th
                    scope="row"
                    colSpan={3}
                    className="hidden px-4 py-3 text-left font-semibold sm:table-cell"
                  >
                    Total
                  </th>
                  <td
                    className={`px-4 py-3 text-right font-display text-xl font-semibold tabular-nums ${voided ? 'text-muted-foreground line-through' : 'text-primary'}`}
                  >
                    {formatCurrency(data.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <dl className="space-y-4">
            <Meta label="Cliente" value={data.customer} />
            <Meta label="Fecha" value={formatDateTime(data.date)} />
            <Meta label="Tipo" value={data.tableId ? `En mesa · ${data.tableId}` : 'Para llevar'} />
            <Meta label="Atendió" value={data.waiter?.username ?? '—'} />
            <Meta label="Caja" value={data.cashRegister?.number ?? 'Sin cobrar'} />
          </dl>
          {voided ? (
            <p className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Factura anulada: no cuenta en ventas ni reportes.
            </p>
          ) : null}
        </Card>
      </div>

      <RenameBillDialog
        open={dialog === 'rename'}
        onClose={() => setDialog(null)}
        billId={billId}
        customer={data.customer}
      />
      <ConfirmDialog
        open={dialog === 'void'}
        onClose={() => setDialog(null)}
        onConfirm={confirmVoid}
        title={`¿Anular la factura #${billId}?`}
        confirmLabel="Anular factura"
        destructive
        pending={cancel.isPending}
      >
        {active
          ? 'La cuenta sigue abierta: se devolverá al inventario lo pedido y se liberará la mesa.'
          : 'La venta dejará de contar en reportes. El inventario no se devuelve porque ya se consumió.'}{' '}
        No se puede deshacer.
      </ConfirmDialog>
    </>
  )
}
