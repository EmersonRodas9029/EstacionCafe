import { useState } from 'react'
import { toast } from 'sonner'
import { useListTables } from '@/api/generated/tables/tables'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Select } from '@/components/ui/select'
import { TABLE_STATUS } from '@/features/tables/table-status'
import { useEditBill } from '../hooks/use-bill-actions'

/** Cambia la cuenta de mesa (la API ocupa la nueva y libera la anterior si queda vacía). */
export function MoveBillDialog({
  open,
  onClose,
  billId,
  currentTableId,
}: {
  open: boolean
  onClose: () => void
  billId: number
  currentTableId: string
}) {
  const tables = useListTables({ query: { enabled: open, select: (r) => r.data } })
  const [target, setTarget] = useState('')
  const editBill = useEditBill()
  const options = (tables.data ?? []).filter((t) => t.tableId !== currentTableId)

  const confirm = () =>
    editBill.mutate(
      { id: billId, data: { tableId: target } },
      {
        onSuccess: () => {
          toast.success(`Cuenta movida a la mesa ${target}`)
          onClose()
        },
      },
    )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Mover de mesa"
      description={`La cuenta está en la mesa ${currentTableId}.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="accent" onClick={confirm} disabled={!target || editBill.isPending}>
            Mover
          </Button>
        </>
      }
    >
      <FormField label="Mesa destino">
        {(control) => (
          <Select {...control} value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="" disabled>
              {tables.isPending ? 'Cargando mesas…' : 'Selecciona una mesa'}
            </option>
            {options.map((t) => (
              <option key={t.tableId} value={t.tableId}>
                {t.tableId} · {t.zone} · {TABLE_STATUS[t.status].label}
              </option>
            ))}
          </Select>
        )}
      </FormField>
    </Dialog>
  )
}
