import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

/** Paginación simple: "1–25 de 80" con anterior/siguiente. */
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-4 pt-4">
      <p className="text-sm text-muted-foreground tabular-nums">
        {first}–{last} de {total}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Siguiente <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
