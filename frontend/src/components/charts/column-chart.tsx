import { useId } from 'react'
import { cn } from '@/lib/utils'

export type ColumnDatum = { key: string; label: string; value: number; detail?: string }

/**
 * Columnas en SVG/CSS sin librería: el contenedor describe la serie para lectores
 * de pantalla y la tabla oculta da los valores exactos.
 */
export function ColumnChart({
  data,
  title,
  format,
  className,
}: {
  data: ColumnDatum[]
  title: string
  format: (value: number) => string
  className?: string
}) {
  const id = useId()
  const max = Math.max(...data.map((d) => d.value), 0)
  // Muchas columnas: se rotula una de cada N para que no se encimen
  const labelEvery = Math.ceil(data.length / 10)

  return (
    <figure className={cn('space-y-3', className)}>
      <figcaption id={id} className="sr-only">
        {title}
      </figcaption>
      <div
        role="img"
        aria-labelledby={id}
        className="flex h-48 items-end gap-1 border-b border-border pb-px"
      >
        {data.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className="min-h-px rounded-t-sm bg-accent transition-colors group-hover:bg-accent-strong"
              style={{ height: max > 0 ? `${(d.value / max) * 100}%` : 0 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-primary px-2 py-1 text-xs whitespace-nowrap text-primary-foreground group-hover:block">
              {d.label}: {format(d.value)}
              {d.detail ? ` · ${d.detail}` : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 text-[0.7rem] text-muted-foreground" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.key} className="flex-1 truncate text-center">
            {i % labelEvery === 0 ? d.label : ''}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
