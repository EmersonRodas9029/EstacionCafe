import { cva } from 'class-variance-authority'

/** También sirve para dar aspecto de botón a un <Link>. */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // accent-strong para que texto blanco normal cumpla contraste AA
        accent: 'bg-accent-strong text-accent-foreground hover:bg-accent',
        outline: 'border border-primary/30 bg-card text-primary hover:bg-surface-soft',
        ghost: 'text-primary hover:bg-surface-soft',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm', // 44px: área táctil mínima
        lg: 'h-14 px-6 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
