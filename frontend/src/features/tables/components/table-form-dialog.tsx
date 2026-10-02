import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ApiError } from '@/api/errors'
import type { Table } from '@/api/generated/model/table'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useAddTable, useEditTable } from '../hooks/use-table-admin'
import { tableFormSchema, type TableFormValues } from '../schemas'

const resolver = zodResolver(tableFormSchema)

/** Crear mesa, o cambiarla de zona (el ID es la llave y no se edita). */
export function TableFormDialog({
  open,
  onClose,
  table,
  zones,
  defaultZone,
}: {
  open: boolean
  onClose: () => void
  table?: Table
  zones: string[]
  defaultZone?: string
}) {
  const listId = useId()
  const add = useAddTable()
  const edit = useEditTable()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver,
    defaultValues: { tableId: table?.tableId ?? '', zone: table?.zone ?? defaultZone ?? '' },
  })

  const onSubmit = handleSubmit((values) => {
    if (table)
      return edit.mutate(
        { id: table.tableId, data: { zone: values.zone } },
        {
          onSuccess: () => {
            toast.success(`Mesa ${table.tableId} movida a ${values.zone}`)
            onClose()
          },
        },
      )
    add.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success(`Mesa ${values.tableId} creada`)
          onClose()
        },
        // El ID repetido se señala en su campo, además del toast
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409)
            setError('tableId', { message: 'Ya existe una mesa con ese ID' })
        },
      },
    )
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={table ? `Mesa ${table.tableId}` : 'Nueva mesa'}
      description={table ? 'El identificador no se puede cambiar.' : undefined}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {table ? null : (
          <FormField
            label="Identificador"
            error={errors.tableId?.message}
            hint="Ej. A1, T2, BARRA1. Se guarda en mayúsculas."
          >
            {(control) => (
              <Input
                {...control}
                autoFocus
                autoCapitalize="characters"
                className="uppercase"
                {...register('tableId')}
              />
            )}
          </FormField>
        )}
        <FormField
          label="Zona"
          error={errors.zone?.message}
          hint="Elige una existente o escribe una nueva."
        >
          {(control) => (
            <>
              <Input {...control} list={listId} autoFocus={!!table} {...register('zone')} />
              <datalist id={listId}>
                {zones.map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
            </>
          )}
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={add.isPending || edit.isPending}>
            {table ? 'Guardar' : 'Crear mesa'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
