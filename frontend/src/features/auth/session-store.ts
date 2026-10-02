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
  token: string | null
  user: SessionUser | null
  /**
   * true si la sesión terminó por "Cerrar sesión": el siguiente login no debe
   * volver a la página del usuario anterior. No se persiste.
   */
  loggedOut: boolean
  setToken: (token: string) => void
  setUser: (user: SessionUser) => void
  /** `byUser`: cierre voluntario; sin él (token vencido) se recuerda el destino. */
  clear: (options?: { byUser?: boolean }) => void
}

/** Solo guarda la sesión. Los datos del servidor viven en TanStack Query. */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loggedOut: false,
      setToken: (token) => set({ token, loggedOut: false }),
      setUser: (user) => set({ user }),
      clear: (options) => set({ token: null, user: null, loggedOut: !!options?.byUser }),
    }),
    {
      name: 'estacioncafe-session',
      version: 1,
      partialize: ({ token, user }) => ({ token, user }),
    },
  ),
)

export const useRole = () => useSessionStore((s) => s.user?.role ?? null)
