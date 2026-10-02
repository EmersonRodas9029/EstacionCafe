import { Clock, User, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useListBills } from '@/api/generated/bills/bills'
import type { Bill } from '@/api/generated/model/bill'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { ChargeBillDialog } from '@/features/bills/components/charge-bill-dialog'
import { LIVE_REFRESH_MS } from '@/features/bills/invalidate'
import { formatCurrency, formatElapsed } from '@/lib/format'

/**
 * Cola del cajero: cuentas que los meseros cerraron y esperan cobro,
 * la más antigua primero. Se refresca sola cada 15 s.
 */
export function PaymentsQueuePage() {
  const bills = useListBills(
    { status: 'pending_payment' },
    { query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data } },
  )
  const [charging, setCharging] = useState<Bill | null>(null)
  const queue = (bills.data ?? []).toSorted((a, b) => a.date.localeCompare(b.date))
  const total = queue.reduce((acc, b) => acc + b.total, 0)

  return (
    <>
      <PageHeader
        title="Por cobrar"
        subtitle={
          bills.data
            ? `${queue.length === 1 ? '1 cuenta' : `${queue.length} cuentas`} · ${formatCurrency(total)}`
            : 'Cuentas cerradas por los meseros'
        }
      />

      {bills.isPending ? (
        <Skeleton className="h-48" />
      ) : bills.isError ? (
        <ErrorState
          message="No pudimos cargar las cuentas por cobrar."
          onRetry={() => bills.refetch()}
        />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nada por cobrar"
          description="Cuando un mesero cierre una cuenta aparecerá aquí."
        />
      ) : (
        <ul className="space-y-3">
          {queue.map((bill) => (
            <li
              key={bill.billId}
              className="flex flex-wrap items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-primary">
                  {bill.tableId ? `Mesa ${bill.tableId}` : 'Para llevar'} · {bill.customer}
                </p>
                <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden="true" /> {formatElapsed(bill.date)}
                  </span>
                  {bill.waiter ? (
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3.5" aria-hidden="true" /> {bill.waiter.username}
                    </span>
                  ) : null}
                </p>
              </div>
              <p className="text-xl font-bold text-primary tabular-nums">
                {formatCurrency(bill.total)}
              </p>
              <Button
                variant="accent"
                onClick={() => setCharging(bill)}
                aria-label={`Cobrar ${bill.customer} ${formatCurrency(bill.total)}`}
              >
                <Wallet /> Cobrar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {charging ? (
        <ChargeBillDialog
          open
          onClose={() => setCharging(null)}
          billId={charging.billId}
          customer={charging.customer}
          total={charging.total}
        />
      ) : null}
    </>
  )
}
