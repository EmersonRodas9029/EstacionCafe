import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link, useBlocker, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useListActiveCashRegisters } from '@/api/generated/cash-registers/cash-registers'
import { useListConsumables } from '@/api/generated/consumables/consumables'
import type { ConsumableListItem } from '@/api/generated/model/consumableListItem'
import { useListActiveSuppliers } from '@/api/generated/suppliers/suppliers'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card } from '@/components/ui/card'
import { ChipGroup } from '@/components/ui/chip-group'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/state'
import { UNIT_LABEL } from '@/features/inventory/units'
import { fromLocalDateTime, localDateTimeInput } from '@/lib/dates'
import { formatCurrency, formatQuantity } from '@/lib/format'
import { useAddPurchase } from '../hooks'
import {
  lineSubtotal,
  purchaseFormSchema,
  type PurchaseFormInput,
  type PurchaseFormValues,
} from '../schemas'

const resolver = zodResolver(purchaseFormSchema)
const BACK = '/admin/compras'

function ConsumableOptions({
  consumables,
  supplierId,
}: {
  consumables: ConsumableListItem[]
  supplierId: number
}) {
  const own = consumables.filter((c) => c.supplierId === supplierId)
  const others = consumables.filter((c) => c.supplierId !== supplierId)
  const option = (c: ConsumableListItem) => (
    <option key={c.consumableId} value={c.consumableId}>
      {c.name} ({UNIT_LABEL[c.unitMeasurement]})
    </option>
  )
  if (!supplierId) return <>{consumables.map(option)}</>
  return (
    <>
      {own.length ? <optgroup label="De este proveedor">{own.map(option)}</optgroup> : null}
      {others.length ? <optgroup label="Otros">{others.map(option)}</optgroup> : null}
    </>
  )
}

export function NewPurchasePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const suppliers = useListActiveSuppliers({ query: { select: (r) => r.data } })
  const consumables = useListConsumables({
    query: { select: (r) => r.data.filter((c) => c.active) },
  })
  const registers = useListActiveCashRegisters({ query: { select: (r) => r.data } })
  const save = useAddPurchase()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<PurchaseFormInput, unknown, PurchaseFormValues>({
    resolver,
    defaultValues: {
      date: localDateTimeInput(),
      supplierId: params.get('proveedor') ?? '',
      cashRegisterId: '',
      mode: 'stock',
      details: [{ consumableId: '', quantity: '', unitCost: '' }],
      total: '',
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'details' })
  const [mode, supplierId, lines] = useWatch({ control, name: ['mode', 'supplierId', 'details'] })
  const total = (lines ?? []).reduce((acc, l) => acc + lineSubtotal(l.quantity, l.unitCost), 0)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !save.isSuccess && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (save.data) navigate(`/admin/compras/${save.data.data.purchaseId}`)
  }, [save.data, navigate])

  const all = consumables.data ?? []

  // Al elegir consumible se propone su costo actual
  const onConsumableChange = (index: number, value: string) => {
    const consumable = all.find((c) => c.consumableId === Number(value))
    if (consumable && !getValues(`details.${index}.unitCost`))
      setValue(`details.${index}.unitCost`, consumable.cost || '')
  }

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      {
        data: {
          date: fromLocalDateTime(values.date),
          supplierId: values.supplierId,
          ...(values.cashRegisterId && { cashRegisterId: values.cashRegisterId }),
          ...(values.mode === 'stock'
            ? { details: values.details }
            : { total: Number(values.total) }),
        },
      },
      {
        onSuccess: () =>
          toast.success('Compra registrada', {
            description: values.mode === 'stock' ? 'El inventario se actualizó.' : undefined,
          }),
      },
    ),
  )

  const header = <PageHeader title="Nueva compra" backTo={BACK} backLabel="Compras" />

  if (suppliers.isPending || consumables.isPending)
    return (
      <>
        {header}
        <Skeleton className="h-96" />
      </>
    )
  if (suppliers.isError || consumables.isError)
    return (
      <>
        {header}
        <ErrorState message="No pudimos cargar proveedores y consumibles." />
      </>
    )

  return (
    <>
      {header}
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="grid gap-5 p-5 sm:grid-cols-3">
          <FormField label="Proveedor" error={errors.supplierId?.message}>
            {(c) => (
              <Select {...c} {...register('supplierId')}>
                <option value="">Elige un proveedor</option>
                {suppliers.data.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Fecha y hora" error={errors.date?.message}>
            {(c) => <Input {...c} type="datetime-local" {...register('date')} />}
          </FormField>
          <FormField label="Pagado desde caja" hint="Opcional">
            {(c) => (
              <Select {...c} {...register('cashRegisterId')}>
                <option value="">Ninguna</option>
                {(registers.data ?? []).map((r) => (
                  <option key={r.cashRegisterId} value={r.cashRegisterId}>
                    Caja {r.number}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </Card>

        <Card className="space-y-5 p-5">
          <ChipGroup
            label="Tipo de compra"
            value={mode as 'stock' | 'expense'}
            onChange={(value) => {
              setValue('mode', value, { shouldDirty: true })
              // Un gasto no lleva líneas; al volver a inventario se ofrece una vacía
              if (value === 'expense') setValue('details', [])
              else if (fields.length === 0) append({ consumableId: '', quantity: '', unitCost: '' })
            }}
            options={[
              { value: 'stock', label: 'Con inventario' },
              { value: 'expense', label: 'Gasto sin inventario' },
            ]}
          />

          {mode === 'stock' ? (
            <>
              <p className="text-sm text-muted-foreground">
                Cada línea suma al stock y actualiza el costo por unidad del consumible.
              </p>
              {errors.details?.message ? (
                <p className="text-sm text-destructive">{errors.details.message}</p>
              ) : null}
              <ul className="space-y-3">
                {fields.map((field, index) => {
                  const line = lines?.[index]
                  const consumable = all.find((c) => c.consumableId === Number(line?.consumableId))
                  const unit = consumable ? UNIT_LABEL[consumable.unitMeasurement] : ''
                  const lineErrors = errors.details?.[index]
                  const n = index + 1
                  const consumableField = register(`details.${index}.consumableId`)
                  return (
                    <li
                      key={field.id}
                      className="grid grid-cols-2 gap-3 rounded-md border bg-background/60 p-3 sm:grid-cols-[1fr_8rem_8rem_6rem_auto] sm:items-start"
                    >
                      <div className="col-span-2 space-y-1 sm:col-span-1">
                        <Select
                          aria-label={`Consumible de la línea ${n}`}
                          aria-invalid={lineErrors?.consumableId ? true : undefined}
                          {...consumableField}
                          onChange={(e) => {
                            void consumableField.onChange(e)
                            onConsumableChange(index, e.target.value)
                          }}
                        >
                          <option value="">Elige un consumible</option>
                          <ConsumableOptions consumables={all} supplierId={Number(supplierId)} />
                        </Select>
                        {lineErrors?.consumableId ? (
                          <p className="text-sm text-destructive">
                            {lineErrors.consumableId.message}
                          </p>
                        ) : consumable ? (
                          <p className="text-xs text-muted-foreground">
                            Hay {formatQuantity(consumable.quantity)} {unit}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          placeholder={unit ? `Cantidad (${unit})` : 'Cantidad'}
                          aria-label={`Cantidad de la línea ${n}`}
                          aria-invalid={lineErrors?.quantity ? true : undefined}
                          className="tabular-nums"
                          {...register(`details.${index}.quantity`)}
                        />
                        {lineErrors?.quantity ? (
                          <p className="text-sm text-destructive">{lineErrors.quantity.message}</p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.0001"
                          min="0"
                          placeholder={unit ? `$ por ${unit}` : '$ por unidad'}
                          aria-label={`Costo unitario de la línea ${n}`}
                          aria-invalid={lineErrors?.unitCost ? true : undefined}
                          className="tabular-nums"
                          {...register(`details.${index}.unitCost`)}
                        />
                        {lineErrors?.unitCost ? (
                          <p className="text-sm text-destructive">{lineErrors.unitCost.message}</p>
                        ) : null}
                      </div>
                      <p className="self-center text-right font-semibold text-primary tabular-nums">
                        {formatCurrency(lineSubtotal(line?.quantity, line?.unitCost))}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Quitar línea ${n}`}
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                        className="justify-self-end text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  )
                })}
              </ul>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => append({ consumableId: '', quantity: '', unitCost: '' })}
              >
                <Plus /> Agregar línea
              </Button>
              <div className="flex items-baseline justify-between border-t pt-4">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display text-2xl font-semibold text-primary tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </>
          ) : (
            <div className="sm:max-w-xs">
              <FormField
                label="Total del gasto"
                error={errors.total?.message}
                hint="Servicios, mantenimiento… no mueve inventario."
              >
                {(c) => (
                  <Input
                    {...c}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    {...register('total')}
                  />
                )}
              </FormField>
            </div>
          )}
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-4 backdrop-blur lg:-mx-10 lg:px-10">
          <Link to={BACK} className={buttonVariants({ variant: 'ghost' })}>
            Cancelar
          </Link>
          <Button type="submit" variant="accent" disabled={save.isPending}>
            {save.isPending ? 'Guardando…' : 'Registrar compra'}
          </Button>
        </div>

        <ConfirmDialog
          open={blocker.state === 'blocked'}
          onClose={() => blocker.reset?.()}
          onConfirm={() => blocker.proceed?.()}
          title="¿Descartar la compra?"
          confirmLabel="Descartar"
          destructive
        >
          Los datos que escribiste se perderán.
        </ConfirmDialog>
      </form>
    </>
  )
}
