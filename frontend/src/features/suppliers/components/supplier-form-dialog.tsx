import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { Supplier } from '@/api/generated/model/supplier'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/format'
import { useAddSupplier, useEditSupplier } from '../hooks'
import { supplierFormSchema, type SupplierFormInput, type SupplierFormValues } from '../schemas'

const resolver = zodResolver(supplierFormSchema)

export function SupplierFormDialog({
  onClose,
  supplier,
}: {
  onClose: () => void
  supplier?: Supplier
}) {
  const add = useAddSupplier()
  const edit = useEditSupplier()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormInput, unknown, SupplierFormValues>({
    resolver,
    defaultValues: {
      name: supplier?.name ?? '',
      phone: supplier ? formatPhone(supplier.phone) : '',
      email: supplier?.email ?? '',
    },
  })

  const onSubmit = handleSubmit((data) => {
    const onSuccess = () => {
      toast.success(supplier ? `${data.name} actualizado` : `${data.name} creado`)
      onClose()
    }
    if (supplier) edit.mutate({ id: supplier.supplierId, data }, { onSuccess })
    else add.mutate({ data }, { onSuccess })
  })

  return (
    <Dialog open onClose={onClose} title={supplier ? `Editar ${supplier.name}` : 'Nuevo proveedor'}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Nombre" error={errors.name?.message}>
          {(control) => <Input {...control} autoFocus {...register('name')} />}
        </FormField>
        <FormField label="Teléfono" error={errors.phone?.message} hint="Ej. 2222-3333">
          {(control) => <Input {...control} type="tel" inputMode="tel" {...register('phone')} />}
        </FormField>
        <FormField label="Correo" error={errors.email?.message}>
          {(control) => <Input {...control} type="email" {...register('email')} />}
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={add.isPending || edit.isPending}>
            {supplier ? 'Guardar' : 'Crear proveedor'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
