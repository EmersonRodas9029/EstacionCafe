import { cn } from '@/lib/utils'

/** Marca: taza vista desde arriba con una vía de tren curva (Estación + Café). Va sobre fondo ciruela. */
export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 40 40" aria-hidden="true" className="size-9 shrink-0">
        <circle cx="20" cy="20" r="18" fill="var(--brand-latte)" />
        <circle cx="20" cy="20" r="12.5" fill="var(--brand-plum)" />
        <path
          d="M11 24c4-7 14-11 19-9"
          fill="none"
          stroke="var(--brand-orange)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M13 27.5c4-6 13-9.5 18-8"
          fill="none"
          stroke="var(--brand-latte)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="1.6 2.2"
        />
      </svg>
      {withText ? (
        <span className="font-display text-xl leading-none font-semibold tracking-tight">
          Estación<span className="text-accent-on-dark">Café</span>
        </span>
      ) : null}
    </span>
  )
}
