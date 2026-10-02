import { Armchair } from 'lucide-react'
import { useState } from 'react'
import type { TableStatus } from '@/api/generated/model/tableStatus'
import { PageHeader } from '@/components/page-header'
import { ChipGroup } from '@/components/ui/chip-group'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { formatCurrency } from '@/lib/format'
import { TableCard } from '../components/table-card'
import { useTablesBoard, type BoardTable } from '../hooks/use-tables-board'
import { TABLE_STATUS } from '../table-status'

type StatusFilter = 'todas' | TableStatus

const byTableId = new Intl.Collator('es', { numeric: true })

/** Secciones por zona, mesas en orden natural (A2 antes que A10). */
const groupByZone = (tables: BoardTable[]) => {
  const zones = new Map<string, BoardTable[]>()
  for (const table of tables) zones.set(table.zone, [...(zones.get(table.zone) ?? []), table])
  return [...zones.entries()].map(
    ([zone, list]) =>
      [zone, list.toSorted((a, b) => byTableId.compare(a.tableId, b.tableId))] as const,
  )
}

export function TablesMapPage() {
  const board = useTablesBoard()
  const [zone, setZone] = useState('todas')
  const [status, setStatus] = useState<StatusFilter>('todas')

  const visible = board.tables.filter(
    (t) => (zone === 'todas' || t.zone === zone) && (status === 'todas' || t.status === status),
  )
  const occupied = board.tables.filter((t) => t.status === 'ocupada').length
  const openTotal = board.tables.reduce((acc, t) => acc + t.total, 0)

  return (
    <>
      <PageHeader
        title="Mesas"
        subtitle={
          board.isPending ? null : (
            <span>
              {occupied} de {board.tables.length} ocupadas · {formatCurrency(openTotal)} en cuentas
              abiertas
            </span>
          )
        }
      />

      <div className="mb-6 space-y-3">
        <ChipGroup
          label="Filtrar por zona"
          value={zone}
          onChange={setZone}
          options={[
            { value: 'todas', label: 'Todas las zonas' },
            ...board.zones.map((z) => ({ value: z, label: z })),
          ]}
        />
        <ChipGroup<StatusFilter>
          label="Filtrar por estado"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'todas', label: 'Todos', count: board.tables.length },
            ...(Object.keys(TABLE_STATUS) as TableStatus[]).map((s) => ({
              value: s,
              label: TABLE_STATUS[s].label,
              count: board.tables.filter((t) => t.status === s).length,
            })),
          ]}
        />
      </div>

      {board.isPending ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : board.isError ? (
        <ErrorState message="No pudimos cargar las mesas." onRetry={board.refetch} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No hay mesas"
          description={
            board.tables.length === 0
              ? 'Un administrador debe registrar las mesas.'
              : 'Ninguna mesa coincide con el filtro.'
          }
        />
      ) : (
        <div className="space-y-8">
          {groupByZone(visible).map(([zoneName, tables]) => (
            <section key={zoneName} aria-labelledby={`zone-${zoneName}`} className="space-y-3">
              <h2
                id={`zone-${zoneName}`}
                className="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {zoneName} <span className="font-normal">· {tables.length}</span>
              </h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {tables.map((table) => (
                  <li key={table.tableId}>
                    <TableCard table={table} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
