import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useOpenBill } from '../hooks/use-bill-actions'

const schema = z.object({
  customer: z.string().trim().min(1, 'Escribe un nombre para la cuenta').max(100),
})
const resolver = zodResolver(schema)
type Values = z.infer<typeof schema>

type Props = {
  open: boolean
  onClose: () => void
  /** Sin mesa = orden para llevar */
  tableId?: string
  defaultName: string
}

/** Abre una cuenta y lleva directo a tomar la orden. */
export function NewBillDialog({ open, onClose, tableId, defaultName }: Props) {
  const navigate = useNavigate()
  const openBill = useOpenBill()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver, values: { customer: defaultName } })

  const onSubmit = handleSubmit(({ customer }) =>
    openBill.mutate(
      {
        data: tableId
          ? { customer, tableId, orderType: 'dine_in' }
          : { customer, orderType: 'takeaway' },
      },
      {
        onSuccess: ({ data }) => {
          onClose()
          navigate(`/mesero/cuentas/${data.billId}/orden`)
        },
      },
    ),
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tableId ? `Nueva cuenta · Mesa ${tableId}` : 'Nueva orden para llevar'}
      description="Usa el nombre del cliente para separar cuentas en la misma mesa."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Nombre de la cuenta" error={errors.customer?.message}>
          {(control) => (
            <Input {...control} autoFocus autoComplete="off" {...register('customer')} />
          )}
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={openBill.isPending}>
            Abrir y tomar orden
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
