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
  setToken: (token: string) => void
  setUser: (user: SessionUser) => void
  clear: () => void
}

/** Solo guarda la sesión. Los datos del servidor viven en TanStack Query. */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'estacioncafe-session', version: 1 },
  ),
)

export const useRole = () => useSessionStore((s) => s.user?.role ?? null)
