import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type NamedItem = { id: number; name: string; count: number }

type Handlers = {
  /** Cada handler devuelve una promesa que se resuelve si la API aceptó el cambio. */
  onCreate: (name: string) => Promise<unknown>
  onRename: (id: number, name: string) => Promise<unknown>
  onDelete: (item: NamedItem) => Promise<unknown>
}

type Labels = {
  title: string
  description: string
  newPlaceholder: string
  empty: string
  countLabel: (count: number) => string
  blockedHint: string
  maxLength: number
}

function validate(name: string, items: NamedItem[], maxLength: number, exceptId?: number) {
  const clean = name.trim()
  if (!clean) return 'Escribe un nombre'
  if (clean.length > maxLength) return `Máximo ${maxLength} caracteres`
  const taken = items.some((i) => i.id !== exceptId && i.name.toLowerCase() === clean.toLowerCase())
  return taken ? 'Ya existe uno con ese nombre' : null
}

function ItemRow({
  item,
  items,
  labels,
  handlers,
}: {
  item: NamedItem
  items: NamedItem[]
  labels: Labels
  handlers: Handlers
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setPending(true)
    try {
      await action()
      after?.()
    } catch {
      // El error ya se avisó con toast desde la mutación
    } finally {
      setPending(false)
    }
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    const problem = validate(name, items, labels.maxLength, item.id)
    if (problem) return setError(problem)
    void run(
      () => handlers.onRename(item.id, name.trim()),
      () => setEditing(false),
    )
  }

  if (editing)
    return (
      <li className="py-2">
        <form onSubmit={save} noValidate className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <Input
              aria-label={`Nuevo nombre de ${item.name}`}
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
            disabled={pending}
          >
            <Check />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Cancelar"
            onClick={() => {
              setEditing(false)
              setName(item.name)
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
        <p className="truncate font-semibold text-primary">{item.name}</p>
        <p className="text-sm text-muted-foreground">{labels.countLabel(item.count)}</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Renombrar ${item.name}`}
        onClick={() => setEditing(true)}
      >
        <Pencil />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Eliminar ${item.name}`}
        title={item.count > 0 ? labels.blockedHint : undefined}
        disabled={item.count > 0 || pending}
        onClick={() => void run(() => handlers.onDelete(item))}
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 />
      </Button>
    </li>
  )
}

/** Catálogos simples de solo nombre (categorías, tipos): crear, renombrar y eliminar vacíos. */
export function NamedItemsDialog({
  open,
  onClose,
  items,
  labels,
  ...handlers
}: { open: boolean; onClose: () => void; items: NamedItem[]; labels: Labels } & Handlers) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const add = async (event: FormEvent) => {
    event.preventDefault()
    const problem = validate(name, items, labels.maxLength)
    if (problem) return setError(problem)
    setPending(true)
    try {
      await handlers.onCreate(name.trim())
      setName('')
    } catch {
      // Aviso por toast desde la mutación
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={labels.title} description={labels.description}>
      <form onSubmit={add} noValidate className="mb-4 space-y-1">
        <div className="flex gap-2">
          <Input
            aria-label={labels.newPlaceholder}
            aria-invalid={error ? true : undefined}
            placeholder={labels.newPlaceholder}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
          <Button type="submit" variant="accent" className="h-12" disabled={pending}>
            <Plus /> Agregar
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      {items.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} items={items} labels={labels} handlers={handlers} />
          ))}
        </ul>
      )}
    </Dialog>
  )
}
