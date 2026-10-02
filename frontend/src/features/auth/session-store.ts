import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/api/generated/model/role'

export type SessionUser = {
  userId: number
  username: string
  email: string
  role: Role
}

type SessionState = {
  /**
   * Usuario de la sesión. El token vive solo en la cookie httpOnly que maneja
   * el navegador: aquí no hay nada que robar con un XSS.
   */
  user: SessionUser | null
  /**
   * true si la sesión terminó por "Cerrar sesión" o por inactividad: el siguiente
   * login no hereda la página del usuario anterior. No se persiste.
   */
  loggedOut: boolean
  /** Última ruta de cada usuario al cerrarse por inactividad (para retomar su orden). */
  lastRoutes: Record<number, { path: string; at: number }>
  setUser: (user: SessionUser) => void
  /** `byUser`: cierre voluntario o por inactividad; sin él (sesión vencida) se recuerda el destino. */
  clear: (options?: { byUser?: boolean }) => void
  rememberRoute: (userId: number, path: string) => void
  forgetRoute: (userId: number) => void
}

/** Solo guarda la sesión. Los datos del servidor viven en TanStack Query. */
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      loggedOut: false,
      lastRoutes: {},
      setUser: (user) => set({ user, loggedOut: false }),
      clear: (options) => set({ user: null, loggedOut: !!options?.byUser }),
      rememberRoute: (userId, path) =>
        set({ lastRoutes: { ...get().lastRoutes, [userId]: { path, at: Date.now() } } }),
      forgetRoute: (userId) => {
        if (!(userId in get().lastRoutes)) return
        const { [userId]: _forgotten, ...rest } = get().lastRoutes
        set({ lastRoutes: rest })
      },
    }),
    {
      name: 'estacioncafe-session',
      version: 2,
      partialize: ({ user, lastRoutes }) => ({ user, lastRoutes }),
      // v1 guardaba el token en localStorage: se descarta y se pide entrar de nuevo
      migrate: () => ({ user: null, lastRoutes: {} }),
    },
  ),
)

export const useRole = () => useSessionStore((s) => s.user?.role ?? null)

/** Una ruta guardada solo sirve mientras dura una sesión con PIN (30 min). */
export const RESUME_MAX_AGE_MS = 30 * 60_000

export const resumableRoute = (userId: number) => {
  const saved = useSessionStore.getState().lastRoutes[userId]
  return saved && Date.now() - saved.at < RESUME_MAX_AGE_MS ? saved.path : undefined
}
