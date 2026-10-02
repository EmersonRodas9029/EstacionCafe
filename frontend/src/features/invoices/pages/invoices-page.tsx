import { Download, FileSearch, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useListBills } from '@/api/generated/bills/bills'
import type { Bill } from '@/api/generated/model/bill'
import type { BillStatus } from '@/api/generated/model/billStatus'
import type { ListBillsParams } from '@/api/generated/model/listBillsParams'
import type { OrderType } from '@/api/generated/model/orderType'
import { useListTables } from '@/api/generated/tables/tables'
import { PageHeader } from '@/components/page-header'
import { PeriodFilter } from '@/components/period-filter'
import { describePeriod, usePeriod } from '@/lib/period'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { Stat } from '@/components/ui/stat'
import { BILL_STATUS, isSold, PAYMENT_LABEL } from '@/features/bills/bill-status'
import { downloadCsv, toCsv, type CsvColumn } from '@/lib/csv'
import { daysRange } from '@/lib/dates'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const placeOf = (bill: Bill) => (bill.tableId ? `Mesa ${bill.tableId}` : 'Para llevar')

const CSV_COLUMNS: CsvColumn<Bill>[] = [
  { header: 'Factura', value: (b) => b.billId },
  { header: 'Fecha', value: (b) => formatDateTime(b.date) },
  { header: 'Cliente', value: (b) => b.customer },
  { header: 'Tipo', value: (b) => (b.orderType === 'takeaway' ? 'Para llevar' : 'Mesa') },
  { header: 'Mesa', value: (b) => b.tableId },
  { header: 'Mesero', value: (b) => b.waiter?.username },
  { header: 'Caja', value: (b) => b.cashRegister?.number },
  { header: 'Estado', value: (b) => BILL_STATUS[b.status].label },
  { header: 'Pago', value: (b) => (b.paymentMethod ? PAYMENT_LABEL[b.paymentMethod] : '') },
  { header: 'Total', value: (b) => b.total.toFixed(2) },
]

export function InvoicesPage() {
  const periodState = usePeriod('today')
  const range = periodState.period
  const [status, setStatus] = useState<BillStatus | 'all'>('all')
  const [orderType, setOrderType] = useState<OrderType | 'all'>('all')
  const [tableId, setTableId] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const tables = useListTables({ query: { select: (r) => r.data } })
  const params: ListBillsParams = {
    ...daysRange(range.from, range.to),
    ...(status !== 'all' && { status }),
    ...(orderType !== 'all' && { orderType }),
    ...(tableId !== 'all' && { tableId }),
  }
  const bills = useListBills(params, { query: { select: (r) => r.data } })

  // La API no filtra por cliente: se busca sobre el rango ya traído
  const filtered = useMemo(() => {
    const query = normalize(search.trim())
    const all = bills.data ?? []
    return query ? all.filter((b) => normalize(`${b.customer} ${b.billId}`).includes(query)) : all
  }, [bills.data, search])

  const sold = filtered.filter((b) => isSold(b.status))
  const soldTotal = sold.reduce((acc, b) => acc + b.total, 0)
  const byMethod = (method: 'cash' | 'card') =>
    sold.filter((b) => b.paymentMethod === method).reduce((acc, b) => acc + b.total, 0)
  const voided = filtered.filter((b) => b.status === 'void').length
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Cualquier cambio de filtro vuelve a la primera página
  const filter =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setPage(1)
    }

  const exportCsv = () =>
    downloadCsv(`facturas_${range.from}_${range.to}.csv`, toCsv(filtered, CSV_COLUMNS))

  return (
    <>
      <PageHeader
        title="Facturas"
        subtitle={describePeriod(range)}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download /> Exportar CSV
          </Button>
        }
      />

      <div className="mb-5 space-y-4">
        <PeriodFilter state={periodState} onChange={() => setPage(1)} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <FormField label="Cliente o número">
              {(control) => (
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    {...control}
                    type="search"
                    value={search}
                    onChange={(e) => filter(setSearch)(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </FormField>
          </div>
          <FormField label="Estado">
            {(control) => (
              <Select
                {...control}
                value={status}
                onChange={(e) => filter(setStatus)(e.target.value as BillStatus | 'all')}
              >
                <option value="all">Todos</option>
                {Object.entries(BILL_STATUS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Tipo">
            {(control) => (
              <Select
                {...control}
                value={orderType}
                onChange={(e) => {
                  const next = e.target.value as OrderType | 'all'
                  filter(setOrderType)(next)
                  if (next === 'takeaway') setTableId('all')
                }}
              >
                <option value="all">Todos</option>
                <option value="dine_in">En mesa</option>
                <option value="takeaway">Para llevar</option>
              </Select>
            )}
          </FormField>
          <FormField label="Mesa">
            {(control) => (
              <Select
                {...control}
                value={tableId}
                disabled={orderType === 'takeaway'}
                onChange={(e) => filter(setTableId)(e.target.value)}
              >
                <option value="all">Todas</option>
                {(tables.data ?? []).map((t) => (
                  <option key={t.tableId} value={t.tableId}>
                    {t.tableId}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Facturas" value={String(filtered.length)} />
        <Stat
          label="Vendido"
          value={formatCurrency(soldTotal)}
          hint={`Efectivo ${formatCurrency(byMethod('cash'))} · Tarjeta ${formatCurrency(byMethod('card'))}`}
        />
        <Stat
          label="Ticket promedio"
          value={formatCurrency(sold.length ? soldTotal / sold.length : 0)}
        />
        <Stat label="Anuladas" value={String(voided)} />
      </div>

      {bills.isPending ? (
        <Skeleton className="h-72" />
      ) : bills.isError ? (
        <ErrorState message="No pudimos cargar las facturas." onRetry={() => bills.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Sin facturas"
          description="No hay facturas con estos filtros."
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
                    Cliente
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                    Fecha
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">
                    Mesero
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((bill) => (
                  <tr key={bill.billId} className={cn(bill.status === 'void' && 'bg-muted/40')}>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{bill.billId}</td>
                    <td className="max-w-0 px-4 py-3">
                      <Link
                        to={`/admin/facturas/${bill.billId}`}
                        className="block truncate font-semibold text-primary hover:text-accent-strong"
                      >
                        {bill.customer}
                      </Link>
                      <p className="truncate text-muted-foreground">
                        {placeOf(bill)}
                        <span className="md:hidden"> · {formatDateTime(bill.date)}</span>
                      </p>
                      <Badge tone={BILL_STATUS[bill.status].tone} className="mt-1 sm:hidden">
                        {BILL_STATUS[bill.status].label}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums md:table-cell">
                      {formatDateTime(bill.date)}
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap lg:table-cell">
                      {bill.waiter?.username ?? '—'}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge tone={BILL_STATUS[bill.status].tone}>
                        {BILL_STATUS[bill.status].label}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums',
                        bill.status === 'void'
                          ? 'text-muted-foreground line-through'
                          : 'text-primary',
                      )}
                    >
                      {formatCurrency(bill.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
        </>
      )}
    </>
  )
}
