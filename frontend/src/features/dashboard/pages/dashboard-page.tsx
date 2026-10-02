import { AlertTriangle, ArrowRight, Armchair, ClipboardList, ShoppingBag } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useListBills } from '@/api/generated/bills/bills'
import { useListLowStockConsumables } from '@/api/generated/consumables/consumables'
import { useListTables } from '@/api/generated/tables/tables'
import { BarList } from '@/components/charts/bar-list'
import { ColumnChart } from '@/components/charts/column-chart'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Stat } from '@/components/ui/stat'
import { LIVE_REFRESH_MS } from '@/features/bills/invalidate'
import { UNIT_LABEL } from '@/features/inventory/units'
import { grossMargin, salesByDay } from '@/features/reports/report-utils'
import { useSalesReport } from '@/features/reports/use-sales-report'
import { localDay, monthStart, shiftDay } from '@/lib/dates'
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format'

function Panel({
  title,
  to,
  linkLabel,
  children,
}: {
  title: string
  to?: string
  linkLabel?: string
  children: ReactNode
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
        {to ? (
          <Link
            to={to}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
          >
            {linkLabel} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {children}
    </Card>
  )
}

function LiveCount({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof Armchair
  label: string
  value: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/40"
    >
      <Icon className="size-6 text-accent" aria-hidden="true" />
      <span>
        <span className="block text-sm text-muted-foreground">{label}</span>{' '}
        <span className="font-display text-2xl font-semibold text-primary tabular-nums">
          {value}
        </span>
      </span>
    </Link>
  )
}

export function DashboardPage() {
  const today = localDay()
  const todayReport = useSalesReport({ from: today, to: today }, 5)
  const weekReport = useSalesReport({ from: shiftDay(today, -6), to: today }, 5)
  const monthReport = useSalesReport({ from: monthStart(today), to: today })
  const live = { query: { refetchInterval: LIVE_REFRESH_MS } }
  const tables = useListTables({ query: { ...live.query, select: (r) => r.data } })
  const open = useListBills({ active: 'true' }, { query: { ...live.query, select: (r) => r.data } })
  const lowStock = useListLowStockConsumables({ query: { select: (r) => r.data } })

  const occupied = (tables.data ?? []).filter((t) => t.status === 'ocupada').length
  const openTakeaway = (open.data ?? []).filter(
    (b) => b.orderType === 'takeaway' && (b.status === 'open' || b.status === 'draft'),
  ).length
  const awaitingPayment = (open.data ?? []).filter((b) => b.status === 'pending_payment').length
  const month = monthReport.data?.summary
  const todaySummary = todayReport.data?.summary

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Hoy, ${formatDate(`${today}T12:00:00-06:00`)}`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {todayReport.isPending || weekReport.isPending || monthReport.isPending ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Stat
              label="Ventas de hoy"
              value={formatCurrency(todaySummary?.totalSales ?? 0)}
              hint={`${todaySummary?.billsCount ?? 0} cuentas · ticket ${formatCurrency(todaySummary?.averageTicket ?? 0)}`}
            />
            <Stat
              label="Últimos 7 días"
              value={formatCurrency(weekReport.data?.summary.totalSales ?? 0)}
              hint={`${weekReport.data?.summary.billsCount ?? 0} cuentas`}
            />
            <Stat
              label="Este mes"
              value={formatCurrency(month?.totalSales ?? 0)}
              hint={`${month?.billsCount ?? 0} cuentas`}
            />
            <Stat
              label="Margen del mes"
              value={`${grossMargin(month?.totalSales ?? 0, month?.grossProfit ?? 0)}%`}
              hint={`Utilidad ${formatCurrency(month?.grossProfit ?? 0)}`}
            />
          </>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <LiveCount
          icon={Armchair}
          label="Mesas ocupadas"
          value={tables.data ? `${occupied} de ${tables.data.length}` : '—'}
          to="/mesero/mesas"
        />
        <LiveCount
          icon={ClipboardList}
          label="Cuentas en curso"
          value={open.data ? `${open.data.length} · ${awaitingPayment} por cobrar` : '—'}
          to="/mesero/cobros"
        />
        <LiveCount
          icon={ShoppingBag}
          label="Para llevar en preparación"
          value={open.data ? String(openTakeaway) : '—'}
          to="/mesero/para-llevar"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Ventas de los últimos 7 días" to="/admin/reportes" linkLabel="Reportes">
          {weekReport.data ? (
            <ColumnChart
              data={salesByDay(weekReport.data.byDay, shiftDay(today, -6), today)}
              title="Ventas de los últimos 7 días"
              format={formatCurrency}
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </Panel>

        <Panel title="Más vendidos de la semana">
          {weekReport.data ? (
            <BarList
              data={weekReport.data.topProducts.map((p) => ({
                key: p.productId,
                label: p.name,
                value: p.quantity,
                detail: formatCurrency(p.total),
              }))}
              format={(n) => `${n} u.`}
              empty="Sin ventas esta semana."
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </Panel>

        <Panel title="Stock bajo" to="/admin/inventario" linkLabel="Inventario">
          {lowStock.isPending ? (
            <Skeleton className="h-24" />
          ) : (lowStock.data ?? []).length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              Todo el inventario está sobre el mínimo.
            </p>
          ) : (
            <ul className="divide-y">
              {lowStock.data!.map((c) => (
                <li key={c.consumableId} className="flex items-center gap-3 py-2">
                  <AlertTriangle
                    className="size-4 shrink-0 text-accent-strong"
                    aria-hidden="true"
                  />
                  <span className="flex-1 font-semibold text-primary">{c.name}</span>
                  <span className="text-sm text-accent-strong tabular-nums">
                    {formatQuantity(c.quantity)} / {formatQuantity(c.minStock)}{' '}
                    {UNIT_LABEL[c.unitMeasurement]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
