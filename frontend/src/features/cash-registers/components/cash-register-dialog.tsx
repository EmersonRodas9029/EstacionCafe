import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/api/errors'
import type { CashRegister } from '@/api/generated/model/cashRegister'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useAddCashRegister, useEditCashRegister } from '../hooks'

const schema = z.object({
  number: z.string().trim().min(1, 'Escribe el número').max(20, 'Máximo 20 caracteres'),
})
const resolver = zodResolver(schema)

export function CashRegisterDialog({
  onClose,
  register: cashRegister,
}: {
  onClose: () => void
  register?: CashRegister
}) {
  const add = useAddCashRegister()
  const edit = useEditCashRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver, defaultValues: { number: cashRegister?.number ?? '' } })

  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409)
      setError('number', { message: 'Ya existe una caja con ese número' })
  }

  const onSubmit = handleSubmit(({ number }) => {
    const onSuccess = () => {
      toast.success(cashRegister ? `Caja ${number} actualizada` : `Caja ${number} creada`)
      onClose()
    }
    if (cashRegister)
      edit.mutate({ id: cashRegister.cashRegisterId, data: { number } }, { onSuccess, onError })
    else add.mutate({ data: { number } }, { onSuccess, onError })
  })

  return (
    <Dialog
      open
      onClose={onClose}
      title={cashRegister ? `Caja ${cashRegister.number}` : 'Nueva caja'}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField
          label="Número"
          error={errors.number?.message}
          hint="Así la verá el cajero al cobrar, p. ej. 001."
        >
          {(control) => <Input {...control} autoFocus {...register('number')} />}
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={add.isPending || edit.isPending}>
            {cashRegister ? 'Guardar' : 'Crear caja'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
