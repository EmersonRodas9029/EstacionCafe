import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Product } from '@/api/generated/model/product'
import type { ProductType } from '@/api/generated/model/productType'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateCategory, useDeleteCategory, useRenameCategory } from '../hooks/use-catalog'

/** Valida contra la regla del backend (1–50) y evita nombres repetidos. */
function validateName(name: string, categories: ProductType[], exceptId?: number) {
  const clean = name.trim()
  if (!clean) return 'Escribe un nombre'
  if (clean.length > 50) return 'Máximo 50 caracteres'
  const taken = categories.some(
    (c) => c.productTypeId !== exceptId && c.name.toLowerCase() === clean.toLowerCase(),
  )
  return taken ? 'Ya existe una categoría con ese nombre' : null
}

function CategoryRow({
  category,
  count,
  categories,
}: {
  category: ProductType
  count: number
  categories: ProductType[]
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [error, setError] = useState<string | null>(null)
  const rename = useRenameCategory()
  const remove = useDeleteCategory()

  const save = (event: FormEvent) => {
    event.preventDefault()
    const problem = validateName(name, categories, category.productTypeId)
    if (problem) return setError(problem)
    rename.mutate(
      { id: category.productTypeId, data: { name: name.trim() } },
      { onSuccess: () => setEditing(false) },
    )
  }

  if (editing)
    return (
      <li className="py-2">
        <form onSubmit={save} noValidate className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <Input
              aria-label={`Nuevo nombre de ${category.name}`}
              aria-invalid={error ? true : undefined}
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              className="h-11"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <Button
            type="submit"
            size="icon"
            variant="accent"
            aria-label="Guardar nombre"
            disabled={rename.isPending}
          >
            <Check />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Cancelar"
            onClick={() => {
              setEditing(false)
              setName(category.name)
              setError(null)
            }}
          >
            <X />
          </Button>
        </form>
      </li>
    )

  return (
    <li className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-primary">{category.name}</p>
        <p className="text-sm text-muted-foreground">
          {count === 1 ? '1 producto' : `${count} productos`}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Renombrar ${category.name}`}
        onClick={() => setEditing(true)}
      >
        <Pencil />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Eliminar ${category.name}`}
        title={count > 0 ? 'Mueve o desactiva sus productos primero' : undefined}
        disabled={count > 0 || remove.isPending}
        onClick={() =>
          remove.mutate(
            { id: category.productTypeId },
            { onSuccess: () => toast.success(`Categoría "${category.name}" eliminada`) },
          )
        }
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 />
      </Button>
    </li>
  )
}

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
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const create = useCreateCategory()

  const add = (event: FormEvent) => {
    event.preventDefault()
    const problem = validateName(name, categories)
    if (problem) return setError(problem)
    create.mutate(
      { data: { name: name.trim() } },
      {
        onSuccess: () => {
          toast.success(`Categoría "${name.trim()}" creada`)
          setName('')
        },
      },
    )
  }

  const countOf = (id: number) => products.filter((p) => p.productTypeId === id).length

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Categorías"
      description="Agrupan el menú del mesero. Solo se eliminan las que no tienen productos."
    >
      <form onSubmit={add} noValidate className="mb-4 space-y-1">
        <div className="flex gap-2">
          <Input
            aria-label="Nueva categoría"
            aria-invalid={error ? true : undefined}
            placeholder="Nueva categoría"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
          <Button type="submit" variant="accent" className="h-12" disabled={create.isPending}>
            <Plus /> Agregar
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      {categories.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">Aún no hay categorías.</p>
      ) : (
        <ul className="divide-y">
          {categories.map((category) => (
            <CategoryRow
              key={category.productTypeId}
              category={category}
              count={countOf(category.productTypeId)}
              categories={categories}
            />
          ))}
        </ul>
      )}
    </Dialog>
  )
}
