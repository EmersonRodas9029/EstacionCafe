import { toast } from 'sonner'
import type { Consumable } from '@/api/generated/model/consumable'
import type { ConsumableType } from '@/api/generated/model/consumableType'
import { NamedItemsDialog } from '@/components/named-items-dialog'
import { useAddConsumableType, useRemoveConsumableType, useRenameConsumableType } from '../hooks'

export function ConsumableTypesDialog({
  onClose,
  types,
  consumables,
}: {
  onClose: () => void
  types: ConsumableType[]
  consumables: Consumable[]
}) {
  const create = useAddConsumableType()
  const rename = useRenameConsumableType()
  const remove = useRemoveConsumableType()

  return (
    <NamedItemsDialog
      open
      onClose={onClose}
      items={types.map((t) => ({
        id: t.consumableTypeId,
        name: t.name,
        count: consumables.filter((c) => c.consumableTypeId === t.consumableTypeId).length,
      }))}
      labels={{
        title: 'Tipos de consumible',
        description: 'Agrupan el inventario. Solo se eliminan los que no tienen consumibles.',
        newPlaceholder: 'Nuevo tipo',
        empty: 'Aún no hay tipos.',
        countLabel: (n) => (n === 1 ? '1 consumible' : `${n} consumibles`),
        blockedHint: 'Cambia el tipo de sus consumibles primero',
        maxLength: 255,
      }}
      onCreate={async (name) => {
        await create.mutateAsync({ data: { name } })
        toast.success(`Tipo "${name}" creado`)
      }}
      onRename={(id, name) => rename.mutateAsync({ id, data: { name } })}
      onDelete={async (item) => {
        await remove.mutateAsync({ id: item.id })
        toast.success(`Tipo "${item.name}" eliminado`)
      }}
    />
  )
}
