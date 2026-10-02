import { AlertTriangle, RotateCcw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-primary/25 bg-card px-6 py-12 text-center">
      <Icon className="size-10 text-accent" aria-hidden="true" />
      <p className="font-display text-xl font-semibold text-primary">{title}</p>
      {description ? <p className="max-w-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-6 py-10 text-center"
    >
      <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      <p className="text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw /> Reintentar
        </Button>
      ) : null}
    </div>
  )
}
