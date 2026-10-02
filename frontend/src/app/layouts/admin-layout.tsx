import { Menu, Utensils, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ADMIN_NAV } from '../navigation'
import { ThemeQuickToggle } from '@/features/theme/theme-toggle'
import { LogoutButton } from './logout-button'
import { UserChip } from './user-chip'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-accent-strong text-accent-foreground'
      : 'text-chrome-foreground/75 hover:bg-white/10 hover:text-chrome-foreground',
  )

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5 bg-chrome p-4 text-chrome-foreground">
      <Logo className="px-2 pt-2" />
      <nav aria-label="Administración" className="flex-1 space-y-4 overflow-y-auto">
        {ADMIN_NAV.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-xs font-semibold tracking-wider text-surface/80 uppercase">
              {group.title}
            </p>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}>
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="space-y-3 border-t border-white/10 pt-4">
        <Link
          to="/mesero/mesas"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-surface hover:bg-white/10"
        >
          <Utensils className="size-5" aria-hidden="true" /> Panel de mesas
        </Link>
        <div className="flex items-center justify-between px-1">
          <UserChip />
          <ThemeQuickToggle className="ml-auto" />
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}

/** Panel de administración: escritorio primero, menú lateral en drawer en móvil. */
export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeMenu()
  }

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <AdminSidebar />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-chrome px-4 text-chrome-foreground lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls="admin-drawer"
          onClick={() => setMenuOpen(true)}
          className="text-chrome-foreground hover:bg-white/10"
        >
          <Menu />
        </Button>
        <Logo />
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" onKeyDown={onKeyDown}>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/60"
            onClick={closeMenu}
          />
          <div
            id="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de administración"
            className="relative h-full w-72 max-w-[85vw] shadow-xl"
          >
            <AdminSidebar onNavigate={closeMenu} />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar menú"
              autoFocus
              onClick={closeMenu}
              className="absolute top-3 right-3 text-chrome-foreground hover:bg-white/10"
            >
              <X />
            </Button>
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
