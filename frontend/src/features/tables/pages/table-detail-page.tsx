import { CalendarClock, CircleCheck, Plus, Receipt, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { useListBills } from '@/api/generated/bills/bills'
import { useGetTable, useGetTableBoard } from '@/api/generated/tables/tables'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { BillRow } from '@/features/bills/components/bill-row'
import { ChargeTableDialog } from '@/features/bills/components/charge-table-dialog'
import { NewBillDialog } from '@/features/bills/components/new-bill-dialog'
import { useChangeTableStatus } from '@/features/bills/hooks/use-bill-actions'
import { LIVE_REFRESH_MS } from '@/features/bills/invalidate'
import { formatCurrency } from '@/lib/format'
import { useSessionStore } from '@/features/auth/session-store'
import { TableStatusBadge } from '../components/table-status-badge'

type DialogName = 'new' | 'charge' | null

export function TableDetailPage() {
  const tableId = decodeURIComponent(useParams().tableId ?? '')
  const [dialog, setDialog] = useState<DialogName>(null)
  const closeDialog = () => setDialog(null)

  const table = useGetTable(tableId, {
    query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data },
  })
  const bills = useListBills(
    { tableId, status: 'open' },
    { query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data } },
  )
  const changeStatus = useChangeTableStatus()
  // Quién más atiende la mesa (la API no da montos ni cuentas ajenas al mesero)
  const me = useSessionStore((s) => s.user?.userId)
  const board = useGetTableBoard({
    query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data },
  })
  const boardTable = board.data?.find((t) => t.tableId === tableId)
  const others = (boardTable?.attendedBy ?? [])
    .filter((w) => w.waiterId !== me)
    .map((w) => w.username)
  // El mesero solo cobra lo suyo; cajero y admin cobran la mesa completa
  const chargesOwnOnly = boardTable?.all === undefined && others.length > 0

  const openBills = bills.data ?? []
  const total = openBills.reduce((acc, b) => acc + b.total, 0)

  if (table.isError) {
    return (
      <ErrorState message={`No encontramos la mesa ${tableId}.`} onRetry={() => table.refetch()} />
    )
  }

  const status = table.data?.status
  const canToggleReservation = openBills.length === 0 && status && status !== 'ocupada'

  return (
    <>
      <PageHeader
        backTo="/mesero/mesas"
        backLabel="Mesas"
        title={`Mesa ${tableId}`}
        subtitle={
          table.data ? (
            <span className="flex items-center gap-2">
              {table.data.zone} <TableStatusBadge status={table.data.status} />
            </span>
          ) : null
        }
        actions={
          <>
            {canToggleReservation ? (
              <Button
                variant="outline"
                disabled={changeStatus.isPending}
                onClick={() =>
                  changeStatus.mutate({
                    id: tableId,
                    data: { status: status === 'reservada' ? 'disponible' : 'reservada' },
                  })
                }
              >
                {status === 'reservada' ? <CircleCheck /> : <CalendarClock />}
                {status === 'reservada' ? 'Liberar reserva' : 'Reservar'}
              </Button>
            ) : null}
            {openBills.length > 0 ? (
              <Button variant="primary" onClick={() => setDialog('charge')}>
                <Wallet /> {chargesOwnOnly ? 'Cobrar mis cuentas' : 'Cobrar mesa'}
              </Button>
            ) : null}
            <Button variant="accent" onClick={() => setDialog('new')}>
              <Plus /> Nueva cuenta
            </Button>
          </>
        }
      />

      {others.length > 0 ? (
        <p className="mb-4 rounded-md bg-surface-soft px-4 py-3 text-sm text-muted-foreground">
          También atiende esta mesa: <strong className="text-primary">{others.join(', ')}</strong>.
          {boardTable?.all === undefined ? ' Sus cuentas no se muestran aquí.' : ''}
        </p>
      ) : null}

      {bills.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-18" />
          <Skeleton className="h-18" />
        </div>
      ) : bills.isError ? (
        <ErrorState message="No pudimos cargar las cuentas." onRetry={() => bills.refetch()} />
      ) : openBills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={others.length ? 'No tienes cuentas en esta mesa' : 'Mesa sin cuentas'}
          description="Abre una cuenta para empezar a tomar la orden."
          action={
            <Button variant="accent" onClick={() => setDialog('new')}>
              <Plus /> Nueva cuenta
            </Button>
          }
        />
      ) : (
        <section aria-labelledby="open-bills" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2
              id="open-bills"
              className="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {openBills.length} {openBills.length === 1 ? 'cuenta abierta' : 'cuentas abiertas'}
            </h2>
            <p className="font-semibold text-primary tabular-nums">Total {formatCurrency(total)}</p>
          </div>
          <ul className="space-y-3">
            {openBills.map((bill) => (
              <li key={bill.billId}>
                <BillRow bill={bill} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <NewBillDialog
        open={dialog === 'new'}
        onClose={closeDialog}
        tableId={tableId}
        defaultName={`Cuenta ${openBills.length + 1}`}
      />
      <ChargeTableDialog
        open={dialog === 'charge'}
        onClose={closeDialog}
        tableId={tableId}
        billsCount={openBills.length}
        total={total}
      />
    </>
  )
}
