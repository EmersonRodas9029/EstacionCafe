import { ShieldCheck } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/logo'
import { useRole } from '@/features/auth/session-store'
import { cn } from '@/lib/utils'
import { MESERO_NAV } from '../navigation'
import { UserChip } from './user-chip'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-4 lg:py-3 lg:text-sm',
    // Activo: texto blanco (contraste AA), ícono y barra en naranja
    isActive
      ? 'text-primary-foreground before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-full before:bg-accent lg:bg-white/10 lg:before:inset-x-auto lg:before:inset-y-2 lg:before:left-0 lg:before:h-auto lg:before:w-1 [&_svg]:text-accent'
      : 'text-primary-foreground/80 hover:text-primary-foreground',
  )

/** Panel de operación (mesero/cajero): tablet y celular primero. */
export function MeseroLayout() {
  const role = useRole()

  return (
    <div className="min-h-dvh bg-surface-soft lg:grid lg:grid-cols-[15rem_1fr]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-primary px-4 text-primary-foreground lg:hidden">
        <Logo />
        <UserChip />
      </header>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/10 bg-primary pb-[env(safe-area-inset-bottom)] lg:sticky lg:top-0 lg:h-dvh lg:flex-col lg:gap-1 lg:border-t-0 lg:p-4"
      >
        <div className="hidden pb-6 text-primary-foreground lg:block">
          <Logo />
        </div>
        {MESERO_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={tabClass}>
            <Icon className="size-6 lg:size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        {role === 'admin' ? (
          <Link
            to="/admin"
            className="mt-auto hidden items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-surface hover:bg-white/10 lg:flex"
          >
            <ShieldCheck className="size-5" aria-hidden="true" /> Panel admin
          </Link>
        ) : null}
        <div className="hidden pt-4 text-primary-foreground lg:block">
          <UserChip />
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 lg:col-start-2 lg:row-start-1 lg:px-8 lg:pb-10">
        <Outlet />
      </main>
    </div>
  )
}
