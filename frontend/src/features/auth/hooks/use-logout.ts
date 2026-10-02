import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { logout } from '@/api/generated/auth/auth'
import { useSessionStore } from '../session-store'

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return async () => {
    try {
      await logout() // limpia la cookie; si falla igual cerramos localmente
    } catch {
      /* sin conexión: la sesión local se limpia igual */
    }
    useSessionStore.getState().clear({ byUser: true })
    queryClient.clear()
    navigate('/login', { replace: true })
  }
}
