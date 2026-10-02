import { useEffect } from 'react'
import { useGetCurrentUser } from '@/api/generated/users/users'
import { useSessionStore } from '../session-store'

/**
 * Revalida el usuario guardado contra /users/me al abrir la app: la cookie pudo
 * vencer o la sesión revocarse. Un 401 limpia la sesión en el cliente HTTP.
 */
export function useSessionSync() {
  const hasUser = useSessionStore((s) => Boolean(s.user))
  const query = useGetCurrentUser({
    query: { enabled: hasUser, staleTime: 5 * 60_000, retry: false },
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

  return { isChecking: hasUser && query.isPending }
}
