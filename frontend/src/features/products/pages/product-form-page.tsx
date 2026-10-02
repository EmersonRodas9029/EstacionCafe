import { zodResolver } from '@hookform/resolvers/zod'
import { PackageSearch } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useBlocker, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/errors'
import { useListConsumables } from '@/api/generated/consumables/consumables'
import { useListIngredientsByProduct } from '@/api/generated/ingredients/ingredients'
import type { Consumable } from '@/api/generated/model/consumable'
import type { Ingredient } from '@/api/generated/model/ingredient'
import type { Product } from '@/api/generated/model/product'
import type { ProductType } from '@/api/generated/model/productType'
import { useListProductTypes } from '@/api/generated/product-types/product-types'
import { useGetProduct } from '@/api/generated/products/products'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { formatCurrency, marginPercent } from '@/lib/format'
import { ActiveToggle } from '../components/active-toggle'
import { RecipeEditor } from '../components/recipe-editor'
import { useSaveProduct } from '../hooks/use-catalog'
import { productFormSchema, type ProductFormInput, type ProductFormValues } from '../schemas'

const resolver = zodResolver(productFormSchema)
const BACK = '/admin/productos'

const toFormValues = (product: Product | undefined, recipe: Ingredient[]): ProductFormInput => ({
  name: product?.name ?? '',
  description: product?.description ?? '',
  price: product?.price ?? '',
  cost: product?.cost ?? '',
  productTypeId: product?.productTypeId ?? '',
  recipe: recipe.map((i) => ({
    ingredientId: i.ingredientId,
    consumableId: i.consumableId,
    quantity: Number(i.quantity),
  })),
})

function MarginHint({ price, cost }: { price: unknown; cost: unknown }) {
  const p = Number(price)
  const c = Number(cost)
  if (!(p > 0 && c > 0)) return null
  if (p <= c) return <p className="text-sm text-destructive">El precio no cubre el costo.</p>
  return (
    <p className="text-sm text-muted-foreground">
      Ganancia de <strong className="text-primary">{formatCurrency(p - c)}</strong> por unidad ·
      margen <strong className="text-primary">{marginPercent(p, c)}%</strong>
    </p>
  )
}

function ProductForm({
  product,
  recipe,
  categories,
  consumables,
  consumablesError,
}: {
  product?: Product
  recipe: Ingredient[]
  categories: ProductType[]
  consumables: Consumable[]
  consumablesError: boolean
}) {
  const navigate = useNavigate()
  const save = useSaveProduct()
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver,
    defaultValues: toFormValues(product, recipe),
  })
  const [price, cost] = useWatch({ control, name: ['price', 'cost'] })

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !save.isSuccess && currentLocation.pathname !== nextLocation.pathname,
  )

  // Tras guardar se sale sin pasar por el aviso de cambios sin guardar
  useEffect(() => {
    if (save.isSuccess) navigate(BACK)
  }, [save.isSuccess, navigate])

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { productId: product?.productId, values, original: recipe, consumables },
      {
        onSuccess: (saved) => {
          toast.success(product ? `${saved.name} actualizado` : `${saved.name} creado`)
        },
      },
    ),
  )

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="space-y-5 p-5">
          <h2 className="font-display text-xl font-semibold text-primary">Datos</h2>
          <FormField label="Nombre" error={errors.name?.message}>
            {(control) => <Input {...control} autoFocus={!product} {...register('name')} />}
          </FormField>
          <FormField
            label="Descripción"
            error={errors.description?.message}
            hint="Se muestra al mesero en el menú."
          >
            {(control) => <Input {...control} {...register('description')} />}
          </FormField>
          <FormField label="Categoría" error={errors.productTypeId?.message}>
            {(control) => (
              <Select {...control} {...register('productTypeId')}>
                <option value="">Elige una categoría</option>
                {categories.map((c) => (
                  <option key={c.productTypeId} value={c.productTypeId}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Precio de venta" error={errors.price?.message}>
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="tabular-nums"
                  {...register('price')}
                />
              )}
            </FormField>
            <FormField label="Costo" error={errors.cost?.message}>
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="tabular-nums"
                  {...register('cost')}
                />
              )}
            </FormField>
          </div>
          <MarginHint price={price} cost={cost} />
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-primary">Receta</h2>
            <p className="text-sm text-muted-foreground">
              Cantidad de cada consumible por unidad vendida; se descuenta del inventario en cada
              venta.
            </p>
          </div>
          {consumablesError ? (
            <ErrorState message="No pudimos cargar los consumibles." />
          ) : (
            <RecipeEditor
              control={control}
              register={register}
              errors={errors}
              consumables={consumables}
              onUseCost={(value) =>
                setValue('cost', value, { shouldDirty: true, shouldValidate: true })
              }
            />
          )}
        </Card>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex justify-end gap-2 border-t bg-background/95 px-4 py-4 backdrop-blur lg:-mx-10 lg:px-10">
        <Link to={BACK} className={buttonVariants({ variant: 'ghost' })}>
          Cancelar
        </Link>
        <Button type="submit" variant="accent" disabled={save.isPending}>
          {save.isPending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="¿Descartar cambios?"
        confirmLabel="Descartar"
        destructive
      >
        Tienes cambios sin guardar en este producto.
      </ConfirmDialog>
    </form>
  )
}

export function ProductFormPage() {
  const { productId } = useParams()
  const id = Number(productId)
  const editing = productId !== undefined
  const validId = Number.isInteger(id) && id > 0

  const product = useGetProduct(id, {
    query: { enabled: editing && validId, select: (r) => r.data },
  })
  const recipe = useListIngredientsByProduct(id, {
    query: { enabled: editing && validId, select: (r) => r.data },
  })
  const categories = useListProductTypes({ query: { select: (r) => r.data } })
  const consumables = useListConsumables({ query: { select: (r) => r.data } })

  const title = editing ? (product.data?.name ?? 'Producto') : 'Nuevo producto'
  const header = (
    <PageHeader
      title={title}
      subtitle={
        editing && product.data ? (
          <Badge tone={product.data.active ? 'available' : 'neutral'}>
            {product.data.active ? 'Activo en el menú' : 'Inactivo'}
          </Badge>
        ) : (
          'Datos, precio y receta'
        )
      }
      backTo={BACK}
      backLabel="Productos"
      actions={
        editing && product.data ? <ActiveToggle product={product.data} variant="outline" /> : null
      }
    />
  )

  const notFound =
    editing && (!validId || (product.error instanceof ApiError && product.error.status === 404))

  if (notFound)
    return (
      <>
        {header}
        <EmptyState
          icon={PackageSearch}
          title="Producto no encontrado"
          description="Puede que el enlace sea incorrecto."
          action={
            <Link to={BACK} className={buttonVariants({ variant: 'outline' })}>
              Ver productos
            </Link>
          }
        />
      </>
    )

  const loading =
    (editing && (product.isPending || recipe.isPending)) ||
    categories.isPending ||
    consumables.isPending
  const failed = (editing && (product.isError || recipe.isError)) || categories.isError

  return (
    <>
      {header}
      {failed ? (
        <ErrorState
          message="No pudimos cargar el producto."
          onRetry={() => {
            void product.refetch()
            void recipe.refetch()
            void categories.refetch()
          }}
        />
      ) : loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <ProductForm
          key={productId ?? 'new'}
          product={product.data}
          recipe={recipe.data ?? []}
          categories={categories.data ?? []}
          consumables={consumables.data ?? []}
          consumablesError={consumables.isError}
        />
      )}
    </>
  )
}
