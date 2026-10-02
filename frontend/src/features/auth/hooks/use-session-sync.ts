import { useEffect } from 'react'
import { useGetCurrentUser } from '@/api/generated/users/users'
import { useSessionStore } from '../session-store'

/**
 * Revalida el usuario guardado contra /users/me al abrir la app
 * (rol o estado pudieron cambiar). Un 401 limpia la sesión en el cliente HTTP.
 */
export function useSessionSync() {
  const token = useSessionStore((s) => s.token)
  const query = useGetCurrentUser({
    query: { enabled: Boolean(token), staleTime: 5 * 60_000, retry: false },
  })

  const me = query.data?.data
  useEffect(() => {
    if (!me) return
    useSessionStore.getState().setUser({
      userId: me.userId,
      username: me.username,
      email: me.email,
      role: me.role,
    })
  }, [me])

  return { isChecking: Boolean(token) && query.isPending }
}
