import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { logout } from '@/api/generated/auth/auth'
import { useSessionStore } from '../session-store'

/** Señales de que alguien está usando el equipo (el polling de datos no cuenta). */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
const TICK_MS = 250

/**
 * Cierra la sesión tras `timeoutMs` sin interacción. En los últimos `warnMs`
 * expone la cuenta regresiva; cualquier toque la cancela. Guarda la ruta para
 * que el mismo usuario retome su orden al volver a entrar.
 */
export function useIdleLogout(timeoutMs: number, warnMs: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  // 0 = aún sin medir; el efecto fija el inicio al montar
  const lastActivity = useRef(0)
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const pathRef = useRef(location.pathname + location.search)
  useEffect(() => {
    pathRef.current = location.pathname + location.search
  }, [location])

  const signOut = useCallback(async () => {
    const { user, rememberRoute, clear } = useSessionStore.getState()
    if (!user) return
    rememberRoute(user.userId, pathRef.current)
    clear({ byUser: true })
    queryClient.clear()
    navigate('/login', { replace: true })
    toast('Sesión cerrada por inactividad')
    try {
      await logout()
    } catch {
      /* sin red: la cookie vence sola y la sesión local ya se limpió */
    }
  }, [navigate, queryClient])

  useEffect(() => {
    lastActivity.current = Date.now()
    const touch = () => {
      lastActivity.current = Date.now()
      setRemainingMs(null)
    }
    for (const event of ACTIVITY_EVENTS)
      window.addEventListener(event, touch, { passive: true, capture: true })

    const timer = window.setInterval(() => {
      const left = timeoutMs - (Date.now() - lastActivity.current)
      if (left <= 0) {
        window.clearInterval(timer)
        void signOut()
      } else {
        setRemainingMs(left <= warnMs ? left : null)
      }
    }, TICK_MS)

    return () => {
      window.clearInterval(timer)
      for (const event of ACTIVITY_EVENTS)
        window.removeEventListener(event, touch, { capture: true })
    }
  }, [timeoutMs, warnMs, signOut])

  return { remainingMs }
}
