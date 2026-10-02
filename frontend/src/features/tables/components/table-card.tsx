import { Receipt } from 'lucide-react'
import { Link } from 'react-router'
import { formatCurrency, formatElapsed } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BoardTable } from '../hooks/use-tables-board'
import { TableStatusBadge } from './table-status-badge'

const accentByStatus = {
  disponible: 'before:bg-status-available',
  ocupada: 'before:bg-accent',
  reservada: 'before:bg-primary',
} as const

export function TableCard({ table }: { table: BoardTable }) {
  const { count, others } = table
  const names = others.join(', ')
  const oldest = table.openBills.reduce<string | null>(
    (min, b) => (!min || b.date < min ? b.date : min),
    null,
  )

  return (
    <Link
      to={`/mesero/mesas/${encodeURIComponent(table.tableId)}`}
      aria-label={`Mesa ${table.tableId}, ${table.zone}${names ? `, atiende ${names}` : ''}`}
      className={cn(
        'group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-lg border bg-card p-4 pl-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md',
        "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:content-['']",
        accentByStatus[table.status],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-3xl leading-none font-semibold text-primary">
            {table.tableId}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{table.zone}</p>
        </div>
        <TableStatusBadge status={table.status} />
      </div>

      {count > 0 ? (
        <div className="space-y-1">
          {names ? (
            <p className="truncate text-xs text-muted-foreground">
              {/* "También" solo si quien mira tiene cuentas propias en la mesa */}
              {table.mine.bills > 0 ? 'También atiende' : 'Atiende'} {names}
            </p>
          ) : null}
          <div className="flex items-end justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-primary">
              <Receipt className="size-4 text-accent" aria-hidden="true" />
              {count} {count === 1 ? 'cuenta' : 'cuentas'}
              {oldest ? (
                <span className="font-normal text-muted-foreground">· {formatElapsed(oldest)}</span>
              ) : null}
            </p>
            <p className="text-lg font-bold text-primary tabular-nums">
              {formatCurrency(table.total)}
            </p>
          </div>
        </div>
      ) : names ? (
        // Mesa de otro mesero: se sabe quién la atiende, sin montos ni detalle
        <p className="truncate text-sm font-semibold text-primary">Atiende {names}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Sin cuentas abiertas</p>
      )}
    </Link>
  )
}
