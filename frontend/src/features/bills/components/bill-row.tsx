import { ChevronRight, Clock, User } from 'lucide-react'
import { Link } from 'react-router'
import type { Bill } from '@/api/generated/model/bill'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatElapsed } from '@/lib/format'
import { BILL_STATUS } from '../bill-status'

/** Fila de cuenta abierta (mesa o para llevar). */
export function BillRow({ bill }: { bill: Bill }) {
  return (
    <Link
      to={`/mesero/cuentas/${bill.billId}`}
      className="flex min-h-18 items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-xs transition hover:border-primary/30 hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2">
          <span className="truncate text-lg font-semibold text-primary">{bill.customer}</span>
          {bill.status === 'pending_payment' ? (
            <Badge tone={BILL_STATUS.pending_payment.tone}>
              {BILL_STATUS.pending_payment.label}
            </Badge>
          ) : null}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
      <p className="text-xl font-bold text-primary tabular-nums">{formatCurrency(bill.total)}</p>
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
