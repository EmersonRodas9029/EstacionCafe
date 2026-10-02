import {
  ArrowRightLeft,
  CheckCheck,
  Clock,
  Pencil,
  Plus,
  Printer,
  ShoppingBasket,
  User,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useGetBill } from '@/api/generated/bills/bills'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { formatCurrency, formatElapsed } from '@/lib/format'
import { BILL_STATUS, isEditable } from '../bill-status'
import { BillLines } from '../components/bill-lines'
import { ChargeBillDialog } from '../components/charge-bill-dialog'
import { MoveBillDialog } from '../components/move-bill-dialog'
import { RenameBillDialog } from '../components/rename-bill-dialog'
import { useEditBill } from '../hooks/use-bill-actions'
import { useBillLines } from '../hooks/use-bill-lines'
import { LIVE_REFRESH_MS } from '../invalidate'

type DialogName = 'rename' | 'move' | 'charge' | null

export function BillDetailPage() {
  const billId = Number(useParams().billId)
  const [dialog, setDialog] = useState<DialogName>(null)
  const bill = useGetBill(billId, {
    query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data },
  })
  const { lines, updateQuantity, removeLine } = useBillLines(billId)
  const editBill = useEditBill()
  const navigate = useNavigate()

  if (bill.isPending) return <Skeleton className="h-64" />
  if (bill.isError)
    return <ErrorState message="No encontramos la cuenta." onRetry={() => bill.refetch()} />

  const data = bill.data
  const editable = isEditable(data.status)
  const backTo = data.tableId
    ? `/mesero/mesas/${encodeURIComponent(data.tableId)}`
    : '/mesero/para-llevar'
  const items = lines.data ?? []
  const total = items.reduce((acc, l) => acc + l.subTotal, 0)
  const isTakeaway = data.orderType === 'takeaway'

  const deliver = () =>
    editBill.mutate(
      { id: billId, data: { status: 'finished' } },
      { onSuccess: () => toast.success(`Orden de ${data.customer} entregada`) },
    )

  return (
    <>
      <PageHeader
        backTo={backTo}
        backLabel={data.tableId ? `Mesa ${data.tableId}` : 'Para llevar'}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {data.customer}
            <Badge tone={BILL_STATUS[data.status].tone}>{BILL_STATUS[data.status].label}</Badge>
          </span>
        }
        subtitle={
          <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden="true" /> Abierta hace{' '}
              {formatElapsed(data.date)}
            </span>
            {data.waiter ? (
              <span className="inline-flex items-center gap-1">
                <User className="size-4" aria-hidden="true" /> {data.waiter.username}
              </span>
            ) : null}
          </span>
        }
        actions={
          editable ? (
            <>
              <Button variant="ghost" onClick={() => setDialog('rename')}>
                <Pencil /> Renombrar
              </Button>
              {data.tableId ? (
                <Button variant="ghost" onClick={() => setDialog('move')}>
                  <ArrowRightLeft /> Mover de mesa
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section aria-label="Productos de la cuenta" className="space-y-3">
          {lines.isPending ? (
            <Skeleton className="h-40" />
          ) : lines.isError ? (
            <ErrorState
              message="No pudimos cargar los productos."
              onRetry={() => lines.refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={ShoppingBasket}
              title="Cuenta vacía"
              description="Agrega productos para empezar."
            />
          ) : (
            <BillLines
              lines={items}
              editable={editable}
              onQuantity={(line, quantity) =>
                updateQuantity.mutate({ id: line.billDetailId, data: { quantity } })
              }
              onRemove={(line) => removeLine.mutate({ id: line.billDetailId })}
            />
          )}
        </section>

        <aside className="sticky bottom-20 space-y-3 rounded-lg border bg-card p-5 shadow-md lg:top-6 lg:bottom-auto">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-4xl font-semibold text-primary tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
          {editable ? (
            <>
              <Link
                to={`/mesero/cuentas/${billId}/orden`}
                className="flex h-14 items-center justify-center gap-2 rounded-md bg-accent-strong font-semibold text-accent-foreground hover:bg-accent"
              >
                <Plus className="size-5" aria-hidden="true" /> Agregar productos
              </Link>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={items.length === 0}
                onClick={() => setDialog('charge')}
              >
                <Wallet /> Cobrar cuenta
              </Button>
            </>
          ) : null}
          {isTakeaway && data.status === 'closed' ? (
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              onClick={deliver}
              disabled={editBill.isPending}
            >
              <CheckCheck /> Marcar entregada
            </Button>
          ) : null}
          <Link
            to={`/mesero/cuentas/${billId}/ticket`}
            className="flex h-11 items-center justify-center gap-2 rounded-md border border-primary/30 font-semibold text-primary hover:bg-surface-soft"
          >
            <Printer className="size-4" aria-hidden="true" /> {editable ? 'Pre-cuenta' : 'Ticket'}
          </Link>
        </aside>
      </div>

      {data.tableId ? (
        <MoveBillDialog
          open={dialog === 'move'}
          onClose={() => setDialog(null)}
          billId={billId}
          currentTableId={data.tableId}
        />
      ) : null}
      <ChargeBillDialog
        open={dialog === 'charge'}
        onClose={() => setDialog(null)}
        billId={billId}
        customer={data.customer}
        total={total}
        onCharged={() => {
          if (data.tableId) navigate(backTo)
        }}
      />
      <RenameBillDialog
        open={dialog === 'rename'}
        onClose={() => setDialog(null)}
        billId={billId}
        customer={data.customer}
      />
    </>
  )
}
