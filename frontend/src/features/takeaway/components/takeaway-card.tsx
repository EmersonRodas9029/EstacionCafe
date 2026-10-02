import { CheckCheck, Clock } from 'lucide-react'
import { Link } from 'react-router'
import type { Bill } from '@/api/generated/model/bill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BILL_STATUS, TAKEAWAY_STAGE } from '@/features/bills/bill-status'
import { formatCurrency, formatElapsed, formatTime } from '@/lib/format'

export function TakeawayCard({
  bill,
  onDeliver,
  delivering,
}: {
  bill: Bill
  onDeliver: () => void
  delivering: boolean
}) {
  return (
    <article className="flex flex-wrap items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-xs">
      <Link
        to={`/mesero/cuentas/${bill.billId}`}
        className="min-w-0 flex-1 rounded-md py-1 hover:text-accent-strong"
      >
        <p className="flex flex-wrap items-center gap-2">
          <span className="truncate text-lg font-semibold text-primary">{bill.customer}</span>
          <Badge tone={BILL_STATUS[bill.status].tone}>{TAKEAWAY_STAGE[bill.status]}</Badge>
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {bill.status === 'finished'
            ? `Pedido a las ${formatTime(bill.date)}`
            : `Hace ${formatElapsed(bill.date)}`}
          <span>· #{bill.billId}</span>
        </p>
      </Link>
      <p className="text-xl font-bold text-primary tabular-nums">{formatCurrency(bill.total)}</p>
      {bill.status === 'closed' ? (
        <Button variant="accent" onClick={onDeliver} disabled={delivering}>
          <CheckCheck /> Entregar
        </Button>
      ) : null}
    </article>
  )
}
