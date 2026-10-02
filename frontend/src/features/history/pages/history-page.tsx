import { Printer, Receipt } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useListBills } from '@/api/generated/bills/bills'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Stat } from '@/components/ui/stat'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { useRole } from '@/features/auth/session-store'
import { BILL_STATUS, isSold } from '@/features/bills/bill-status'
import { dayRange, localDay } from '@/lib/dates'
import { formatCurrency, formatTime } from '@/lib/format'

export function HistoryPage() {
  const role = useRole()
  const today = localDay()
  const [day, setDay] = useState(today)
  // El mesero ve lo suyo por defecto; cajero y admin, todo
  const [onlyMine, setOnlyMine] = useState(role === 'mesero')

  const bills = useListBills(
    { ...dayRange(day), ...(onlyMine && { mine: 'true' as const }) },
    { query: { select: (r) => r.data } },
  )

  const sold = (bills.data ?? []).filter((b) => isSold(b.status))
  const total = sold.reduce((acc, b) => acc + b.total, 0)

  return (
    <>
      <PageHeader
        title="Historial"
        subtitle={day === today ? 'Ventas del turno de hoy' : `Ventas del ${day}`}
      />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-48">
          <FormField label="Día">
            {(control) => (
              <Input
                {...control}
                type="date"
                max={today}
                value={day}
                onChange={(e) => setDay(e.target.value || today)}
              />
            )}
          </FormField>
        </div>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 font-semibold text-primary">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
            className="size-5 accent-[var(--accent-strong)]"
          />
          Solo mis cuentas
        </label>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Vendido" value={formatCurrency(total)} />
        <Stat label="Cuentas cobradas" value={String(sold.length)} />
        <Stat
          label="Ticket promedio"
          value={formatCurrency(sold.length ? total / sold.length : 0)}
        />
      </div>

      {bills.isPending ? (
        <Skeleton className="h-48" />
      ) : bills.isError ? (
        <ErrorState message="No pudimos cargar el historial." onRetry={() => bills.refetch()} />
      ) : sold.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin ventas"
          description="No hay cuentas cobradas en este día."
        />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {sold.map((bill) => (
            <li key={bill.billId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="w-20 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                {formatTime(bill.date)}
              </span>
              <Link
                to={`/mesero/cuentas/${bill.billId}`}
                className="min-w-0 flex-1 hover:text-accent-strong"
              >
                <span className="block truncate font-semibold text-primary">{bill.customer}</span>
                <span className="text-sm text-muted-foreground">
                  {bill.tableId ? `Mesa ${bill.tableId}` : 'Para llevar'}
                  {bill.waiter && !onlyMine ? ` · ${bill.waiter.username}` : ''}
                </span>
              </Link>
              <Badge tone={BILL_STATUS[bill.status].tone}>{BILL_STATUS[bill.status].label}</Badge>
              <span className="w-20 text-right font-bold text-primary tabular-nums">
                {formatCurrency(bill.total)}
              </span>
              <Link
                to={`/mesero/cuentas/${bill.billId}/ticket`}
                aria-label={`Ticket de ${bill.customer}`}
                className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
              >
                <Printer className="size-5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
