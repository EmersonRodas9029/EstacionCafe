import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-primary',
        available: 'bg-status-available/12 text-status-available-text',
        occupied: 'bg-accent/15 text-accent-text',
        reserved: 'bg-primary/10 text-primary',
        solid: 'bg-primary text-primary-foreground',
        void: 'bg-destructive/10 text-destructive',
        // Por cobrar: contorno naranja, distinto del relleno de 'Abierta'
        pending: 'bg-card text-accent-text ring-1 ring-accent ring-inset',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
