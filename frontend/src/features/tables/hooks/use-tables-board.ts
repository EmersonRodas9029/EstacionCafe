import { useListBills } from '@/api/generated/bills/bills'
import type { Bill } from '@/api/generated/model/bill'
import type { BoardTable as ApiBoardTable } from '@/api/generated/model/boardTable'
import { useGetTableBoard } from '@/api/generated/tables/tables'
import { LIVE_REFRESH_MS } from '@/features/bills/invalidate'
import { useSessionStore } from '@/features/auth/session-store'

export type BoardTable = ApiBoardTable & {
  /** Cuentas abiertas que puedo ver (las mías; todas si soy cajero/admin) */
  openBills: Bill[]
  /** Otros meseros con cuentas en la mesa (sin montos) */
  others: string[]
  /** Cuentas y total visibles para mi rol */
  count: number
  total: number
}

/**
 * Mapa de mesas: el board de la API dice quién atiende cada mesa sin exponer
 * montos ajenos; las cuentas visibles (para el tiempo transcurrido) salen del
 * listado, que la API ya limita al mesero. Se refresca cada 15 s.
 */
export function useTablesBoard() {
  const me = useSessionStore((s) => s.user?.userId)
  const board = useGetTableBoard({
    query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data },
  })
  const bills = useListBills(
    { status: 'open' },
    { query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data } },
  )

  const byTable = new Map<string, Bill[]>()
  for (const bill of bills.data ?? []) {
    if (!bill.tableId) continue
    byTable.set(bill.tableId, [...(byTable.get(bill.tableId) ?? []), bill])
  }

  const tables: BoardTable[] = (board.data ?? []).map((table) => {
    const visible = table.all ?? table.mine
    return {
      ...table,
      openBills: byTable.get(table.tableId) ?? [],
      others: table.attendedBy.filter((w) => w.waiterId !== me).map((w) => w.username),
      count: visible.bills,
      total: visible.total,
    }
  })

  return {
    tables,
    zones: [...new Set(tables.map((t) => t.zone))],
    isPending: board.isPending || bills.isPending,
    isError: board.isError || bills.isError,
    refetch: () => Promise.all([board.refetch(), bills.refetch()]),
  }
}
