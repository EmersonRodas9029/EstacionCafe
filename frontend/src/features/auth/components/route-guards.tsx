import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '@/api/generated/model/role'
import { useSessionStore } from '../session-store'
import { homePathFor, safeRedirect } from '../roles'

/** Exige sesión; si no hay, manda a /login recordando el destino. */
export function RequireAuth() {
  const hasSession = useSessionStore((s) => Boolean(s.token && s.user))
  const loggedOut = useSessionStore((s) => s.loggedOut)
  const location = useLocation()

  if (!hasSession) {
    // Tras "Cerrar sesión" no se recuerda la página: quien entre después parte de su panel
    const state = loggedOut ? undefined : { from: location.pathname + location.search }
    return <Navigate to="/login" replace state={state} />
  }
  return <Outlet />
}

/** Exige uno de los roles; si no, página 403. */
export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const role = useSessionStore((s) => s.user?.role)

  if (!role || !roles.includes(role)) return <Navigate to="/403" replace />
  return <Outlet />
}

/**
 * Solo para invitados (login). Con sesión va a la ruta pedida antes del
 * login (si su rol puede verla) o a su panel. Único punto de redirección post-login.
 */
export function GuestOnly() {
  const role = useSessionStore((s) => s.user?.role)
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  if (role) return <Navigate to={safeRedirect(from, role)} replace />
  return <Outlet />
}

/** "/" redirige al panel del rol. */
export function RoleHomeRedirect() {
  const role = useSessionStore((s) => s.user?.role)
  return <Navigate to={role ? homePathFor(role) : '/login'} replace />
}
