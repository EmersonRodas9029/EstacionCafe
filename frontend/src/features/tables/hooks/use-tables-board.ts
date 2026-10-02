import { useListBills } from '@/api/generated/bills/bills'
import type { Bill } from '@/api/generated/model/bill'
import type { Table } from '@/api/generated/model/table'
import { useListTables } from '@/api/generated/tables/tables'
import { LIVE_REFRESH_MS } from '@/features/bills/invalidate'

export type BoardTable = Table & { openBills: Bill[]; total: number }

/** Mesas + cuentas abiertas agrupadas por mesa, refrescadas cada 15 s. */
export function useTablesBoard() {
  const tables = useListTables({
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

  const board: BoardTable[] = (tables.data ?? []).map((table) => {
    const openBills = byTable.get(table.tableId) ?? []
    return { ...table, openBills, total: openBills.reduce((acc, b) => acc + b.total, 0) }
  })

  return {
    tables: board,
    zones: [...new Set(board.map((t) => t.zone))],
    isPending: tables.isPending || bills.isPending,
    isError: tables.isError || bills.isError,
    refetch: () => Promise.all([tables.refetch(), bills.refetch()]),
  }
}
