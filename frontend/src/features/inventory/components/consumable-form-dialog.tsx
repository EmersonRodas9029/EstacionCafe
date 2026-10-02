import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { Consumable } from '@/api/generated/model/consumable'
import type { ConsumableType } from '@/api/generated/model/consumableType'
import type { Supplier } from '@/api/generated/model/supplier'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAddConsumable, useEditConsumable } from '../hooks'
import {
  consumableFormSchema,
  type ConsumableFormInput,
  type ConsumableFormValues,
} from '../schemas'
import { UNIT_LABEL } from '../units'

const resolver = zodResolver(consumableFormSchema)

/** Alta o edición. El stock de uno existente se cambia con "Ajustar" o con compras. */
export function ConsumableFormDialog({
  onClose,
  consumable,
  types,
  suppliers,
}: {
  onClose: () => void
  consumable?: Consumable
  types: ConsumableType[]
  suppliers: Supplier[]
}) {
  const add = useAddConsumable()
  const edit = useEditConsumable()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsumableFormInput, unknown, ConsumableFormValues>({
    resolver,
    defaultValues: {
      name: consumable?.name ?? '',
      consumableTypeId: consumable?.consumableTypeId ?? '',
      supplierId: consumable?.supplierId ?? '',
      unitMeasurement: consumable?.unitMeasurement ?? 'g',
      cost: consumable?.cost ?? '',
      minStock: consumable?.minStock ?? 0,
      quantity: consumable?.quantity ?? 0,
    },
  })

  const onSubmit = handleSubmit(({ quantity, ...values }) => {
    const onSuccess = () => {
      toast.success(consumable ? `${values.name} actualizado` : `${values.name} creado`)
      onClose()
    }
    if (consumable) edit.mutate({ id: consumable.consumableId, data: values }, { onSuccess })
    else add.mutate({ data: { ...values, quantity } }, { onSuccess })
  })

  // Un proveedor inactivo solo se muestra si ya era el del consumible
  const supplierOptions = suppliers.filter(
    (s) => s.active || s.supplierId === consumable?.supplierId,
  )

  return (
    <Dialog
      open
      onClose={onClose}
      title={consumable ? `Editar ${consumable.name}` : 'Nuevo consumible'}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Nombre" error={errors.name?.message}>
          {(control) => <Input {...control} autoFocus {...register('name')} />}
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tipo" error={errors.consumableTypeId?.message}>
            {(control) => (
              <Select {...control} {...register('consumableTypeId')}>
                <option value="">Elige</option>
                {types.map((t) => (
                  <option key={t.consumableTypeId} value={t.consumableTypeId}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Unidad" error={errors.unitMeasurement?.message}>
            {(control) => (
              <Select {...control} {...register('unitMeasurement')}>
                {Object.entries(UNIT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
        <FormField label="Proveedor" error={errors.supplierId?.message}>
          {(control) => (
            <Select {...control} {...register('supplierId')}>
              <option value="">Elige un proveedor</option>
              {supplierOptions.map((s) => (
                <option key={s.supplierId} value={s.supplierId}>
                  {s.name}
                  {s.active ? '' : ' (inactivo)'}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Costo por unidad"
            error={errors.cost?.message}
            hint="Hasta 4 decimales. Las compras lo actualizan."
          >
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="decimal"
                step="0.0001"
                min="0"
                {...register('cost')}
              />
            )}
          </FormField>
          <FormField
            label="Stock mínimo"
            error={errors.minStock?.message}
            hint="Debajo de esto se avisa."
          >
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                {...register('minStock')}
              />
            )}
          </FormField>
        </div>
        {consumable ? null : (
          <FormField label="Stock inicial" error={errors.quantity?.message}>
            {(control) => (
              <Input
                {...control}
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                {...register('quantity')}
              />
            )}
          </FormField>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={add.isPending || edit.isPending}>
            {consumable ? 'Guardar' : 'Crear consumible'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
