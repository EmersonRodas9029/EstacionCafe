import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel = 'Volver',
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 space-y-3">
      {backTo ? (
        <Link
          to={backTo}
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-primary">{title}</h1>
          {subtitle ? <div className="text-muted-foreground">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
