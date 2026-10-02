import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, pinLogin } from '@/api/generated/auth/auth'
import type { SessionUser as ApiSessionUser } from '@/api/generated/model/sessionUser'
import { useSessionStore, type SessionUser } from '../session-store'
import type { LoginValues } from '../schemas'

/** Empieza la sesión: la caché del usuario anterior no debe verse (tablet compartida). */
function useStartSession() {
  const queryClient = useQueryClient()
  return (user: ApiSessionUser): SessionUser => {
    queryClient.clear()
    const session = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role,
    }
    useSessionStore.getState().setUser(session)
    return session
  }
}

/** Login con usuario y contraseña (admin, o cualquiera fuera de un dispositivo autorizado). */
export function useLogin() {
  const start = useStartSession()
  return useMutation({
    mutationFn: async (values: LoginValues) => start((await login(values)).data.user),
  })
}

/** Login con PIN en un dispositivo autorizado (meseros y cajeros). */
export function usePinLogin() {
  const start = useStartSession()
  return useMutation({
    mutationFn: async (pin: string) => start((await pinLogin({ pin })).data.user),
  })
}
