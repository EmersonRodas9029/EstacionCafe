import { Armchair, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Table } from '@/api/generated/model/table'
import { useListTables } from '@/api/generated/tables/tables'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { RenameZoneDialog } from '../components/rename-zone-dialog'
import { TableFormDialog } from '../components/table-form-dialog'
import { TableStatusBadge } from '../components/table-status-badge'
import { groupByZone } from '../group-by-zone'
import { useRemoveTable } from '../hooks/use-table-admin'

type DialogState =
  | { kind: 'create'; zone?: string }
  | { kind: 'edit'; table: Table }
  | { kind: 'delete'; table: Table }
  | { kind: 'zone'; zone: string; tableIds: string[] }
  | null

export function TablesAdminPage() {
  const tables = useListTables({ query: { select: (r) => r.data } })
  const remove = useRemoveTable()
  const [dialog, setDialog] = useState<DialogState>(null)
  const close = () => setDialog(null)

  const all = tables.data ?? []
  const groups = groupByZone(all)
  const zones = groups.map(([zone]) => zone)

  const confirmDelete = (table: Table) =>
    remove.mutate(
      { id: table.tableId },
      {
        onSuccess: () => {
          toast.success(`Mesa ${table.tableId} eliminada`)
          close()
        },
        onError: close,
      },
    )

  return (
    <>
      <PageHeader
        title="Mesas y zonas"
        subtitle={tables.data ? `${all.length} mesas en ${zones.length} zonas` : undefined}
        actions={
          <Button variant="accent" onClick={() => setDialog({ kind: 'create' })}>
            <Plus /> Nueva mesa
          </Button>
        }
      />

      {tables.isPending ? (
        <Skeleton className="h-64" />
      ) : tables.isError ? (
        <ErrorState message="No pudimos cargar las mesas." onRetry={() => tables.refetch()} />
      ) : all.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="Aún no hay mesas"
          description="Crea la primera y asígnale una zona (Interior, Terraza…)."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map(([zone, list]) => (
            <Card key={zone} className="overflow-hidden">
              <section aria-labelledby={`zone-${zone}`}>
                <header className="flex items-center justify-between gap-2 border-b bg-surface-soft px-4 py-3">
                  <div>
                    <h2
                      id={`zone-${zone}`}
                      className="font-display text-lg font-semibold text-primary"
                    >
                      {zone}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {list.length === 1 ? '1 mesa' : `${list.length} mesas`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDialog({ kind: 'create', zone })}
                      aria-label={`Agregar mesa en ${zone}`}
                    >
                      <Plus /> Mesa
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Renombrar zona ${zone}`}
                      onClick={() =>
                        setDialog({ kind: 'zone', zone, tableIds: list.map((t) => t.tableId) })
                      }
                    >
                      <Pencil />
                    </Button>
                  </div>
                </header>
                <ul className="divide-y">
                  {list.map((table) => (
                    <li key={table.tableId} className="flex items-center gap-3 px-4 py-2">
                      <span className="w-20 font-display text-lg font-semibold text-primary">
                        {table.tableId}
                      </span>
                      <span className="flex-1">
                        <TableStatusBadge status={table.status} />
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Editar mesa ${table.tableId}`}
                        onClick={() => setDialog({ kind: 'edit', table })}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Eliminar mesa ${table.tableId}`}
                        title={table.status === 'ocupada' ? 'Tiene cuentas abiertas' : undefined}
                        disabled={table.status === 'ocupada'}
                        onClick={() => setDialog({ kind: 'delete', table })}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            </Card>
          ))}
        </div>
      )}

      {/* Se monta al abrir para empezar siempre con el formulario limpio */}
      {dialog?.kind === 'create' || dialog?.kind === 'edit' ? (
        <TableFormDialog
          open
          onClose={close}
          table={dialog.kind === 'edit' ? dialog.table : undefined}
          defaultZone={dialog.kind === 'create' ? dialog.zone : undefined}
          zones={zones}
        />
      ) : null}
      {dialog?.kind === 'zone' ? (
        <RenameZoneDialog open onClose={close} zone={dialog.zone} tableIds={dialog.tableIds} />
      ) : null}
      <ConfirmDialog
        open={dialog?.kind === 'delete'}
        onClose={close}
        onConfirm={() => dialog?.kind === 'delete' && confirmDelete(dialog.table)}
        title={dialog?.kind === 'delete' ? `¿Eliminar la mesa ${dialog.table.tableId}?` : ''}
        confirmLabel="Eliminar"
        destructive
        pending={remove.isPending}
      >
        Solo se pueden eliminar mesas sin historial de cuentas. Si ya tuvo ventas, cámbiala de zona
        en lugar de borrarla.
      </ConfirmDialog>
    </>
  )
}
