import { Outlet } from 'react-router'
import { Logo } from '@/components/logo'
import { Spinner } from '@/components/ui/spinner'
import { useSessionSync } from '@/features/auth/hooks/use-session-sync'

/** Pantalla de carga de marca (sesión y primeras rutas lazy). */
export function Splash({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-primary text-primary-foreground">
      <div className="flex flex-col items-center gap-5">
        <Logo />
        <Spinner label={label} />
      </div>
    </div>
  )
}

/** Revalida la sesión guardada antes de mostrar rutas protegidas. */
export function Root() {
  const { isChecking } = useSessionSync()
  return isChecking ? <Splash label="Verificando sesión" /> : <Outlet />
}
