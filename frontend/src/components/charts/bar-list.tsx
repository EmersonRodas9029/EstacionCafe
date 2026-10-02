export type BarDatum = { key: string | number; label: string; value: number; detail?: string }

/** Ranking con barras horizontales (top productos, categorías). Es una lista legible tal cual. */
export function BarList({
  data,
  format,
  empty = 'Sin datos en este periodo.',
}: {
  data: BarDatum[]
  format: (value: number) => string
  empty?: string
}) {
  if (data.length === 0) return <p className="py-6 text-center text-muted-foreground">{empty}</p>
  const max = Math.max(...data.map((d) => d.value))

  return (
    <ol className="space-y-3">
      {data.map((d) => (
        <li key={d.key} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-primary">{d.label}</span>
            <span className="shrink-0 tabular-nums">
              {format(d.value)}
              {d.detail ? <span className="text-muted-foreground"> · {d.detail}</span> : null}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: max > 0 ? `${(d.value / max) * 100}%` : 0 }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
