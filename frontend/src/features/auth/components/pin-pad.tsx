import { Delete } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ApiError } from '@/api/errors'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { usePinLogin } from '../hooks/use-login'

const LENGTH = 4
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

const messageFor = (error: unknown) =>
  error instanceof ApiError && error.status === 401
    ? 'PIN incorrecto'
    : error instanceof ApiError && error.status === 403
      ? 'Este equipo ya no está autorizado. Entra con usuario y contraseña.'
      : 'No pudimos conectar con el servidor.'

/**
 * Teclado de PIN para tablets compartidas: al completar el 4.º dígito entra
 * solo. Un error limpia el PIN y avisa; nunca bloquea.
 */
export function PinPad() {
  const [pin, setPin] = useState('')
  const pinLogin = usePinLogin()

  // Sin efectos dentro del updater de setPin: StrictMode lo ejecuta dos veces
  const press = (digit: string) => {
    if (pinLogin.isPending || pin.length >= LENGTH) return
    const next = pin + digit
    setPin(next)
    if (next.length === LENGTH) pinLogin.mutate(next, { onError: () => setPin('') })
  }
  const erase = () => setPin((current) => current.slice(0, -1))

  // Teclado físico (PC del local)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) press(event.key)
      else if (event.key === 'Backspace') erase()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const key =
    'grid h-16 place-items-center rounded-xl bg-card text-2xl font-semibold text-primary shadow-xs transition-colors hover:bg-surface-soft active:bg-muted disabled:opacity-50'

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4" aria-hidden="true">
        {Array.from({ length: LENGTH }, (_, i) => (
          <span
            key={i}
            className={cn(
              'size-4 rounded-full border-2 border-primary transition-colors',
              i < pin.length && 'bg-primary',
              pinLogin.isError && pin.length === 0 && 'animate-[shake_0.3s] border-destructive',
            )}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {pin.length} de {LENGTH} dígitos
      </p>
      <p role="alert" className="min-h-6 text-center text-sm font-semibold text-destructive">
        {pinLogin.isError && pin.length === 0 ? messageFor(pinLogin.error) : ''}
      </p>

      <div className="grid grid-cols-3 gap-3" role="group" aria-label="Teclado de PIN">
        {KEYS.map((digit) => (
          <button
            key={digit}
            type="button"
            className={key}
            onClick={() => press(digit)}
            disabled={pinLogin.isPending}
          >
            {digit}
          </button>
        ))}
        <span aria-hidden="true" className="grid place-items-center">
          {pinLogin.isPending ? <Spinner label="Ingresando" /> : null}
        </span>
        <button
          type="button"
          className={key}
          onClick={() => press('0')}
          disabled={pinLogin.isPending}
        >
          0
        </button>
        <button
          type="button"
          className={key}
          onClick={erase}
          disabled={pinLogin.isPending || pin.length === 0}
          aria-label="Borrar dígito"
        >
          <Delete className="size-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
