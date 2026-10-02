import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'admin' | 'mesero' | 'cajero'

type SessionState = {
  token: string | null
  role: Role | null
  setSession: (token: string, role: Role | null) => void
  clear: () => void
}

/** Solo guarda la sesión. Los datos del servidor viven en TanStack Query. */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      setSession: (token, role) => set({ token, role }),
      clear: () => set({ token: null, role: null }),
    }),
    { name: 'estacioncafe-session' },
  ),
)
