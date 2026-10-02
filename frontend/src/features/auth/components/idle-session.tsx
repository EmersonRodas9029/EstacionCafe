import { Hand } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useIdleLogout } from '../hooks/use-idle-logout'
import { useSessionStore } from '../session-store'

export const OPERATION_IDLE_MS = 15_000
export const ADMIN_IDLE_MS = 15 * 60_000
const WARN_MS = 5_000

/**
 * Ruta contenedora que cierra la sesión por inactividad. Panel de mesas: 15 s
 * (equipos compartidos entre meseros); panel admin: 15 min.
 */
export function IdleSession({ timeoutMs }: { timeoutMs: number }) {
  const { remainingMs } = useIdleLogout(timeoutMs, Math.min(WARN_MS, timeoutMs / 3))

  // Ya dentro: la ruta guardada para retomar dejó de servir
  useEffect(() => {
    const user = useSessionStore.getState().user
    if (user) useSessionStore.getState().forgetRoute(user.userId)
  }, [])

  return (
    <>
      <Outlet />
      {remainingMs !== null ? (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="La sesión se cerrará por inactividad"
          className="fixed inset-0 z-[60] grid place-items-center bg-foreground/60 p-6 backdrop-blur-sm"
        >
          <div className="flex max-w-sm flex-col items-center gap-4 rounded-xl bg-card p-8 text-center shadow-xl">
            <Hand className="size-10 text-accent" aria-hidden="true" />
            <p className="font-display text-2xl font-semibold text-primary">¿Sigues ahí?</p>
            <p className="text-muted-foreground">
              La sesión se cerrará en{' '}
              <strong className="text-primary tabular-nums">
                {Math.ceil(remainingMs / 1000)} s
              </strong>
              . Toca la pantalla para continuar.
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}
