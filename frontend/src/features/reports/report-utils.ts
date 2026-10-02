import type { SalesReportByDayItem } from '@/api/generated/model/salesReportByDayItem'
import type { ColumnDatum } from '@/components/charts/column-chart'
import { eachDay } from '@/lib/dates'

const shortDay = new Intl.DateTimeFormat('es-SV', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** Una columna por día del periodo, con 0 en los días sin ventas. */
export const salesByDay = (
  byDay: SalesReportByDayItem[],
  from: string,
  to: string,
): ColumnDatum[] => {
  const map = new Map(byDay.map((d) => [d.date, d]))
  return eachDay(from, to).map((day) => {
    const item = map.get(day)
    const bills = item?.bills ?? 0
    return {
      key: day,
      label: shortDay.format(new Date(`${day}T00:00:00Z`)),
      value: item?.total ?? 0,
      detail: bills === 1 ? '1 cuenta' : `${bills} cuentas`,
    }
  })
}

/** Utilidad bruta sobre ventas, en %. */
export const grossMargin = (sales: number, profit: number) =>
  sales > 0 ? Math.round((profit / sales) * 100) : 0

export const share = (value: number, total: number) =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : '0%'
