import { toast } from 'sonner'
import type { Product } from '@/api/generated/model/product'
import type { ProductType } from '@/api/generated/model/productType'
import { NamedItemsDialog } from '@/components/named-items-dialog'
import { useCreateCategory, useDeleteCategory, useRenameCategory } from '../hooks/use-catalog'

export function CategoriesDialog({
  open,
  onClose,
  categories,
  products,
}: {
  open: boolean
  onClose: () => void
  categories: ProductType[]
  products: Product[]
}) {
  const create = useCreateCategory()
  const rename = useRenameCategory()
  const remove = useDeleteCategory()

  return (
    <NamedItemsDialog
      open={open}
      onClose={onClose}
      items={categories.map((c) => ({
        id: c.productTypeId,
        name: c.name,
        count: products.filter((p) => p.productTypeId === c.productTypeId).length,
      }))}
      labels={{
        title: 'Categorías',
        description: 'Agrupan el menú del mesero. Solo se eliminan las que no tienen productos.',
        newPlaceholder: 'Nueva categoría',
        empty: 'Aún no hay categorías.',
        countLabel: (n) => (n === 1 ? '1 producto' : `${n} productos`),
        blockedHint: 'Mueve o desactiva sus productos primero',
        maxLength: 50,
      }}
      onCreate={async (name) => {
        await create.mutateAsync({ data: { name } })
        toast.success(`Categoría "${name}" creada`)
      }}
      onRename={(id, name) => rename.mutateAsync({ id, data: { name } })}
      onDelete={async (item) => {
        await remove.mutateAsync({ id: item.id })
        toast.success(`Categoría "${item.name}" eliminada`)
      }}
    />
  )
}
