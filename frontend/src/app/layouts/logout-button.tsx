import { LogOut } from 'lucide-react'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { cn } from '@/lib/utils'

/** Cerrar sesión de un toque, junto al nombre (barras de admin y de operación). */
export function LogoutButton({ className }: { className?: string }) {
  const logout = useLogout()
  return (
    <button
      type="button"
      onClick={logout}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-md text-chrome-foreground transition-colors hover:bg-white/10',
        className,
      )}
    >
      <LogOut className="size-5" aria-hidden="true" />
    </button>
  )
}
