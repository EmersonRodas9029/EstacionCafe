import { BarChart3, Download } from 'lucide-react'
import type { ReactNode } from 'react'
import { BarList } from '@/components/charts/bar-list'
import { ColumnChart } from '@/components/charts/column-chart'
import { PageHeader } from '@/components/page-header'
import { PeriodFilter } from '@/components/period-filter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { Stat } from '@/components/ui/stat'
import { downloadCsv, toCsv } from '@/lib/csv'
import { formatCurrency } from '@/lib/format'
import { describePeriod, usePeriod } from '@/lib/period'
import { grossMargin, salesByDay, share } from '../report-utils'
import { useSalesReport } from '../use-sales-report'

const ORDER_TYPE_LABEL = { dine_in: 'En mesa', takeaway: 'Para llevar' } as const

function Section({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

export function ReportsPage() {
  const periodState = usePeriod('week')
  const { period } = periodState
  const report = useSalesReport(period)

  const header = <PageHeader title="Reportes" subtitle={describePeriod(period)} />

  const body = () => {
    if (report.isPending) return <Skeleton className="h-96" />
    if (report.isError)
      return <ErrorState message="No pudimos cargar el reporte." onRetry={() => report.refetch()} />

    const { summary, byDay, topProducts, byProductType, byWaiter, byOrderType } = report.data
    if (summary.billsCount === 0 && summary.purchasesTotal === 0)
      return (
        <EmptyState
          icon={BarChart3}
          title="Sin movimientos"
          description="No hay ventas ni compras en este periodo."
        />
      )

    const days = salesByDay(byDay, period.from, period.to)
    const exportDays = () =>
      downloadCsv(
        `ventas-por-dia_${period.from}_${period.to}.csv`,
        toCsv(days, [
          { header: 'Día', value: (d) => d.key },
          { header: 'Cuentas', value: (d) => d.detail?.replace(/\D/g, '') },
          { header: 'Ventas', value: (d) => d.value.toFixed(2) },
        ]),
      )
    const exportProducts = () =>
      downloadCsv(
        `productos_${period.from}_${period.to}.csv`,
        toCsv(topProducts, [
          { header: 'Producto', value: (p) => p.name },
          { header: 'Unidades', value: (p) => p.quantity },
          { header: 'Ventas', value: (p) => p.total.toFixed(2) },
        ]),
      )

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Ventas"
            value={formatCurrency(summary.totalSales)}
            hint={`${summary.billsCount} cuentas`}
          />
          <Stat label="Ticket promedio" value={formatCurrency(summary.averageTicket)} />
          <Stat
            label="Utilidad bruta"
            value={formatCurrency(summary.grossProfit)}
            hint={`Margen ${grossMargin(summary.totalSales, summary.grossProfit)}% · costo estimado ${formatCurrency(summary.costOfGoods)}`}
          />
          <Stat
            label="Compras"
            value={formatCurrency(summary.purchasesTotal)}
            hint={`Ventas − compras: ${formatCurrency(summary.totalSales - summary.purchasesTotal)}`}
          />
        </div>

        <Section
          title="Ventas por día"
          action={
            <Button size="sm" variant="outline" onClick={exportDays}>
              <Download /> CSV
            </Button>
          }
        >
          <ColumnChart data={days} title="Ventas por día" format={formatCurrency} />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section
            title="Productos más vendidos"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={exportProducts}
                disabled={!topProducts.length}
              >
                <Download /> CSV
              </Button>
            }
          >
            <BarList
              data={topProducts.map((p) => ({
                key: p.productId,
                label: p.name,
                value: p.quantity,
                detail: formatCurrency(p.total),
              }))}
              format={(n) => `${n} u.`}
            />
          </Section>
          <Section title="Por categoría">
            <BarList
              data={byProductType.map((c) => ({
                key: c.productTypeId ?? 'none',
                label: c.name,
                value: c.total,
                detail: share(c.total, summary.totalSales),
              }))}
              format={formatCurrency}
            />
          </Section>
          <Section title="Por mesero">
            <BarList
              data={byWaiter.map((w) => ({
                key: w.waiterId,
                label: w.username,
                value: w.total,
                detail: w.bills === 1 ? '1 cuenta' : `${w.bills} cuentas`,
              }))}
              format={formatCurrency}
            />
          </Section>
          <Section title="En mesa vs. para llevar">
            <BarList
              data={byOrderType.map((o) => ({
                key: o.orderType,
                label: ORDER_TYPE_LABEL[o.orderType],
                value: o.total,
                detail: `${share(o.total, summary.totalSales)} · ${o.bills} cuentas`,
              }))}
              format={formatCurrency}
            />
          </Section>
        </div>
        <p className="text-sm text-muted-foreground">
          Ventas = cuentas cobradas o entregadas; las anuladas no cuentan. El costo usa el costo
          actual de cada producto.
        </p>
      </div>
    )
  }

  return (
    <>
      {header}
      <div className="mb-6">
        <PeriodFilter state={periodState} />
      </div>
      {body()}
    </>
  )
}
