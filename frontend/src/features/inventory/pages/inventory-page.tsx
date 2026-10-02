import { AlertTriangle, Boxes, Pencil, Plus, Search, SlidersHorizontal, Tags } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useListConsumableTypes } from '@/api/generated/consumable-types/consumable-types'
import { useListConsumables } from '@/api/generated/consumables/consumables'
import type { ConsumableListItem } from '@/api/generated/model/consumableListItem'
import { useListSuppliers } from '@/api/generated/suppliers/suppliers'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChipGroup } from '@/components/ui/chip-group'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { formatQuantity, formatUnitCost } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ConsumableFormDialog } from '../components/consumable-form-dialog'
import { ConsumableTypesDialog } from '../components/consumable-types-dialog'
import { StockAdjustDialog } from '../components/stock-adjust-dialog'
import { useDeactivateConsumable, useEditConsumable } from '../hooks'
import { UNIT_LABEL } from '../units'

type StatusFilter = 'active' | 'low' | 'inactive'

type DialogState =
  | { kind: 'form'; consumable?: ConsumableListItem }
  | { kind: 'adjust'; consumable: ConsumableListItem }
  | { kind: 'types' }
  | null

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

function ActiveToggle({ consumable }: { consumable: ConsumableListItem }) {
  const deactivate = useDeactivateConsumable()
  const edit = useEditConsumable()
  const onClick = () =>
    consumable.active
      ? deactivate.mutate(
          { id: consumable.consumableId },
          { onSuccess: () => toast.success(`${consumable.name} desactivado`) },
        )
      : edit.mutate(
          { id: consumable.consumableId, data: { active: true } },
          { onSuccess: () => toast.success(`${consumable.name} activado`) },
        )
  return (
    <Button
      size="sm"
      variant="ghost"
      className="hidden lg:inline-flex"
      disabled={deactivate.isPending || edit.isPending}
      onClick={onClick}
      aria-label={`${consumable.active ? 'Desactivar' : 'Activar'} ${consumable.name}`}
    >
      {consumable.active ? 'Desactivar' : 'Activar'}
    </Button>
  )
}

export function InventoryPage() {
  const consumables = useListConsumables({ query: { select: (r) => r.data } })
  const types = useListConsumableTypes({ query: { select: (r) => r.data } })
  const suppliers = useListSuppliers({ query: { select: (r) => r.data } })
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [dialog, setDialog] = useState<DialogState>(null)
  const close = () => setDialog(null)

  const all = useMemo(() => consumables.data ?? [], [consumables.data])
  const active = all.filter((c) => c.active)
  const low = active.filter((c) => c.lowStock)

  const visible = useMemo(() => {
    const query = normalize(search.trim())
    return all
      .filter(
        (c) =>
          (status === 'inactive' ? !c.active : c.active && (status !== 'low' || c.lowStock)) &&
          (type === 'all' || c.consumableTypeId === Number(type)) &&
          (!query || normalize(`${c.name} ${c.supplier?.name ?? ''}`).includes(query)),
      )
      .toSorted((a, b) => Number(b.lowStock) - Number(a.lowStock) || a.name.localeCompare(b.name))
  }, [all, search, type, status])

  return (
    <>
      <PageHeader
        title="Consumibles"
        subtitle={
          consumables.data ? `${active.length} activos · ${low.length} con stock bajo` : undefined
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog({ kind: 'types' })}>
              <Tags /> Tipos
            </Button>
            <Button variant="accent" onClick={() => setDialog({ kind: 'form' })}>
              <Plus /> Nuevo consumible
            </Button>
          </>
        }
      />

      {low.length > 0 && status !== 'low' ? (
        <button
          type="button"
          onClick={() => setStatus('low')}
          className="mb-5 flex w-full items-center gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-left text-accent-strong hover:bg-accent/15"
        >
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <span>
            <strong>{low.length === 1 ? '1 consumible' : `${low.length} consumibles`}</strong> en o
            por debajo del mínimo: {low.map((c) => c.name).join(', ')}.
          </span>
        </button>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar consumible"
            placeholder="Buscar consumible o proveedor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="lg:w-56">
          <Select aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Todos los tipos</option>
            {(types.data ?? []).map((t) => (
              <option key={t.consumableTypeId} value={t.consumableTypeId}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <ChipGroup
          label="Estado"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'Activos', count: active.length },
            { value: 'low', label: 'Stock bajo', count: low.length },
            { value: 'inactive', label: 'Inactivos', count: all.length - active.length },
          ]}
        />
      </div>

      {consumables.isPending ? (
        <Skeleton className="h-72" />
      ) : consumables.isError ? (
        <ErrorState
          message="No pudimos cargar el inventario."
          onRetry={() => consumables.refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={all.length === 0 ? 'Aún no hay consumibles' : 'Sin resultados'}
          description={
            all.length === 0
              ? 'Registra los insumos que usan tus recetas.'
              : 'Prueba con otra búsqueda o filtro.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-soft text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="w-full px-4 py-3 font-semibold">
                  Consumible
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Stock
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right font-semibold md:table-cell">
                  Mínimo
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">
                  Costo
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((c) => {
                const unit = UNIT_LABEL[c.unitMeasurement]
                return (
                  <tr key={c.consumableId} className={cn(!c.active && 'bg-muted/40')}>
                    <td className="max-w-0 px-4 py-3">
                      <p className="truncate font-semibold text-primary">{c.name}</p>
                      <p className="truncate text-muted-foreground">
                        {c.consumableType?.name ?? 'Sin tipo'} ·{' '}
                        {c.supplier?.name ?? 'Sin proveedor'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <p
                        className={cn(
                          'font-semibold tabular-nums',
                          c.lowStock && c.active ? 'text-accent-strong' : 'text-primary',
                        )}
                      >
                        {formatQuantity(c.quantity)} {unit}
                      </p>
                      {c.lowStock && c.active ? (
                        <Badge tone="occupied" className="mt-1">
                          <AlertTriangle aria-hidden="true" /> Bajo
                        </Badge>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 text-right whitespace-nowrap text-muted-foreground tabular-nums md:table-cell">
                      {formatQuantity(c.minStock)} {unit}
                    </td>
                    <td className="hidden px-4 py-3 text-right whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">
                      {formatUnitCost(c.cost)}/{unit}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-1">
                        <ActiveToggle consumable={c} />
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Ajustar stock de ${c.name}`}
                          onClick={() => setDialog({ kind: 'adjust', consumable: c })}
                        >
                          <SlidersHorizontal />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Editar ${c.name}`}
                          onClick={() => setDialog({ kind: 'form', consumable: c })}
                        >
                          <Pencil />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.kind === 'form' ? (
        <ConsumableFormDialog
          onClose={close}
          consumable={dialog.consumable}
          types={types.data ?? []}
          suppliers={suppliers.data ?? []}
        />
      ) : null}
      {dialog?.kind === 'adjust' ? (
        <StockAdjustDialog onClose={close} consumable={dialog.consumable} />
      ) : null}
      {dialog?.kind === 'types' ? (
        <ConsumableTypesDialog onClose={close} types={types.data ?? []} consumables={all} />
      ) : null}
    </>
  )
}
