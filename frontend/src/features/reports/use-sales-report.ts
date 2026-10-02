import { useGetSalesReport } from '@/api/generated/reports/reports'
import { daysRange } from '@/lib/dates'
import type { Period } from '@/lib/period'

export const useSalesReport = (period: Period, top = 10) =>
  useGetSalesReport(
    { ...daysRange(period.from, period.to), top },
    { query: { select: (r) => r.data } },
  )
