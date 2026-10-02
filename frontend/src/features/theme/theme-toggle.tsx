import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResolvedTheme, useThemeStore, type Theme } from './theme-store'

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

/** Selector completo (Perfil). */
export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore()
  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors',
            theme === value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-primary hover:border-primary/40',
          )}
        >
          <Icon className="size-4" aria-hidden="true" /> {label}
        </button>
      ))}
    </div>
  )
}

/** Botón rápido para las barras: alterna claro ↔ oscuro sobre el tema efectivo. */
export function ThemeQuickToggle({ className }: { className?: string }) {
  const resolved = useResolvedTheme()
  const setTheme = useThemeStore((s) => s.setTheme)
  const next = resolved === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === 'dark' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={cn(
        'grid size-11 place-items-center rounded-md text-chrome-foreground transition-colors hover:bg-white/10',
        className,
      )}
    >
      {next === 'dark' ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </button>
  )
}
