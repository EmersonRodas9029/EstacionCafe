import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login } from '@/api/generated/auth/auth'
import { getCurrentUser, getGetCurrentUserQueryKey } from '@/api/generated/users/users'
import { useSessionStore, type SessionUser } from '../session-store'
import type { LoginValues } from '../schemas'

/** Login + carga del usuario actual (rol) en una sola mutación. */
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LoginValues): Promise<SessionUser> => {
      const { data } = await login(values)
      useSessionStore.getState().setToken(data.token)

      const me = await getCurrentUser()
      queryClient.setQueryData(getGetCurrentUserQueryKey(), me)

      const user: SessionUser = {
        userId: me.data.userId,
        username: me.data.username,
        email: me.data.email,
        role: me.data.role,
      }
      useSessionStore.getState().setUser(user)
      return user
    },
    onError: () => useSessionStore.getState().clear(),
  })
}
