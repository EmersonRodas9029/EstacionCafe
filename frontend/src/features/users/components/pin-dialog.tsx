import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/errors'
import { useClearUserPin, useSetUserPin } from '@/api/generated/users/users'
import type { User } from '@/api/generated/model/user'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useInvalidatingOptions } from '@/lib/mutation-options'

/**
 * Asigna el PIN de un mesero o cajero. La API lo devuelve una sola vez:
 * se muestra aquí para entregárselo y no se puede volver a consultar.
 */
export function PinDialog({
  user,
  onClose,
}: {
  user: User & { hasPin?: boolean }
  onClose: () => void
}) {
  const options = useInvalidatingOptions(['/users'])
  const setPin = useSetUserPin({ mutation: options })
  const clearPin = useClearUserPin({ mutation: options })
  const [manual, setManual] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [assigned, setAssigned] = useState<string | null>(null)

  const assign = (pin?: string) =>
    setPin.mutate(
      { id: user.userId, data: pin ? { pin } : {} },
      {
        onSuccess: (r) => setAssigned(r.data.pin),
        onError: (e) => {
          if (e instanceof ApiError && e.status === 409) setError('Ese PIN ya lo usa otra persona')
        },
      },
    )

  const onManual = (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{4}$/.test(manual)) return setError('Deben ser 4 dígitos')
    assign(manual)
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`PIN de ${user.username}`}
      description="Con él entra en las tablets autorizadas. Cambiarlo cierra sus sesiones abiertas."
    >
      {assigned ? (
        <div className="space-y-4 text-center">
          <KeyRound className="mx-auto size-8 text-accent" aria-hidden="true" />
          <p className="text-muted-foreground">Entrégale este PIN; no se volverá a mostrar.</p>
          <p
            className="font-display text-5xl font-semibold tracking-[0.3em] text-primary tabular-nums"
            aria-label={`PIN asignado ${assigned.split('').join(' ')}`}
          >
            {assigned}
          </p>
          <Button variant="accent" className="w-full" onClick={onClose}>
            Listo
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <Button
            variant="accent"
            className="w-full"
            disabled={setPin.isPending}
            onClick={() => assign()}
          >
            <KeyRound /> Generar PIN aleatorio
          </Button>
          <form onSubmit={onManual} noValidate className="space-y-2">
            <FormField label="O escribe uno" error={error ?? undefined}>
              {(control) => (
                <Input
                  {...control}
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  className="tracking-[0.4em] tabular-nums"
                  value={manual}
                  onChange={(e) => {
                    setManual(e.target.value.replace(/\D/g, '').slice(0, 4))
                    setError(null)
                  }}
                />
              )}
            </FormField>
            <Button type="submit" variant="outline" className="w-full" disabled={setPin.isPending}>
              Asignar este PIN
            </Button>
          </form>
          {user.hasPin ? (
            <Button
              variant="ghost"
              className="w-full text-destructive hover:bg-destructive/10"
              disabled={clearPin.isPending}
              onClick={() =>
                clearPin.mutate(
                  { id: user.userId },
                  {
                    onSuccess: () => {
                      toast.success(`${user.username} ya no tiene PIN`)
                      onClose()
                    },
                  },
                )
              }
            >
              Quitar PIN
            </Button>
          ) : null}
        </div>
      )}
    </Dialog>
  )
}
