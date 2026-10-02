import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useEditBill } from '../hooks/use-bill-actions'

const schema = z.object({ customer: z.string().trim().min(1, 'Escribe un nombre').max(100) })
const resolver = zodResolver(schema)

export function RenameBillDialog({
  open,
  onClose,
  billId,
  customer,
}: {
  open: boolean
  onClose: () => void
  billId: number
  customer: string
}) {
  const editBill = useEditBill()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver, values: { customer } })

  const onSubmit = handleSubmit((data) =>
    editBill.mutate({ id: billId, data }, { onSuccess: onClose }),
  )

  return (
    <Dialog open={open} onClose={onClose} title="Renombrar cuenta">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Nombre de la cuenta" error={errors.customer?.message}>
          {(control) => <Input {...control} autoFocus {...register('customer')} />}
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={editBill.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
