import { Plus, Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useListPurchases } from '@/api/generated/purchases/purchases'
import { useListSuppliers } from '@/api/generated/suppliers/suppliers'
import { PageHeader } from '@/components/page-header'
import { PeriodFilter } from '@/components/period-filter'
import { describePeriod, usePeriod } from '@/lib/period'
import { buttonVariants } from '@/components/ui/button-variants'
import { FormField } from '@/components/ui/form-field'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { Stat } from '@/components/ui/stat'
import { localDay } from '@/lib/dates'
import { formatCurrency, formatDateTime } from '@/lib/format'

const PAGE_SIZE = 25

export function PurchasesPage() {
  // La API lista todas las compras: el periodo y proveedor se filtran aquí
  const purchases = useListPurchases({ query: { select: (r) => r.data } })
  const suppliers = useListSuppliers({ query: { select: (r) => r.data } })
  const periodState = usePeriod('month')
  const { period } = periodState
  const [supplierId, setSupplierId] = useState('all')
  const [page, setPage] = useState(1)

  const visible = useMemo(
    () =>
      (purchases.data ?? [])
        .filter((p) => {
          const day = localDay(new Date(p.date))
          return (
            day >= period.from &&
            day <= period.to &&
            (supplierId === 'all' || p.supplierId === Number(supplierId))
          )
        })
        .toSorted((a, b) => b.date.localeCompare(a.date)),
    [purchases.data, period, supplierId],
  )
  const total = visible.reduce((acc, p) => acc + p.total, 0)

  return (
    <>
      <PageHeader
        title="Compras"
        subtitle={describePeriod(period)}
        actions={
          <Link to="/admin/compras/nueva" className={buttonVariants({ variant: 'accent' })}>
            <Plus /> Nueva compra
          </Link>
        }
      />

      <div className="mb-5 space-y-4">
        <PeriodFilter state={periodState} onChange={() => setPage(1)} />
        <div className="sm:max-w-xs">
          <FormField label="Proveedor">
            {(control) => (
              <Select
                {...control}
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">Todos</option>
                {(suppliers.data ?? []).map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <Stat label="Compras" value={String(visible.length)} />
        <Stat label="Total gastado" value={formatCurrency(total)} />
      </div>

      {purchases.isPending ? (
        <Skeleton className="h-64" />
      ) : purchases.isError ? (
        <ErrorState message="No pudimos cargar las compras." onRetry={() => purchases.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin compras"
          description="No hay compras en este periodo."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-surface-soft text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    #
                  </th>
                  <th scope="col" className="w-full px-4 py-3 font-semibold">
                    Proveedor
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
                  <tr key={p.purchaseId}>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{p.purchaseId}</td>
                    <td className="max-w-0 px-4 py-3">
                      <Link
                        to={`/admin/compras/${p.purchaseId}`}
                        className="block truncate font-semibold text-primary hover:text-accent-strong"
                      >
                        {p.supplier?.name ?? `Proveedor ${p.supplierId}`}
                      </Link>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {formatDateTime(p.date)}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">
                      {formatDateTime(p.date)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-primary tabular-nums">
                      {formatCurrency(p.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={visible.length} onChange={setPage} />
        </>
      )}
    </>
  )
}
