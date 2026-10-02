import { CheckCircle2, MonitorSmartphone, Pencil, ShieldOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useGetDeviceStatus } from '@/api/generated/auth/auth'
import { useListDevices } from '@/api/generated/devices/devices'
import type { Device } from '@/api/generated/model/device'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthorizeThisDevice, useForgetDevice, useRenameDevice, useRevoke } from '../hooks'

const validName = (name: string) => {
  const clean = name.trim()
  if (!clean) return 'Escribe un nombre'
  return clean.length > 60 ? 'Máximo 60 caracteres' : null
}

function ThisDevice() {
  const status = useGetDeviceStatus({ query: { select: (r) => r.data } })
  const authorize = useAuthorizeThisDevice()
  const forget = useForgetDevice()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const problem = validName(name)
    if (problem) return setError(problem)
    authorize.mutate(
      { data: { name: name.trim() } },
      { onSuccess: () => toast.success(`"${name.trim()}" autorizado para entrar con PIN`) },
    )
  }

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-1 font-display text-lg font-semibold text-primary">Este equipo</h2>
      {status.isPending ? (
        <Skeleton className="h-12" />
      ) : status.data?.authorized ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-status-available" aria-hidden="true" />
            Autorizado como <strong className="text-primary">{status.data.name}</strong>: los
            meseros y cajeros entran aquí con su PIN.
          </p>
          <Button
            variant="outline"
            disabled={forget.isPending}
            onClick={() =>
              forget.mutate(undefined, {
                onSuccess: () => toast.success('Este equipo ya no usa PIN'),
              })
            }
          >
            Olvidar este equipo
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <p className="text-muted-foreground">
            No autorizado: aquí solo se entra con usuario y contraseña. Autorízalo si es una tablet
            o PC del local.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1">
              <FormField
                label="Nombre del equipo"
                error={error ?? undefined}
                hint="Ej. Tablet terraza"
              >
                {(control) => (
                  <Input
                    {...control}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError(null)
                    }}
                  />
                )}
              </FormField>
            </div>
            <Button
              type="submit"
              variant="accent"
              className="sm:mt-7"
              disabled={authorize.isPending}
            >
              <MonitorSmartphone /> Autorizar este equipo
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}

function RenameDialog({ device, onClose }: { device: Device; onClose: () => void }) {
  const [name, setName] = useState(device.name)
  const [error, setError] = useState<string | null>(null)
  const rename = useRenameDevice()
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const problem = validName(name)
    if (problem) return setError(problem)
    rename.mutate({ id: device.deviceId, data: { name: name.trim() } }, { onSuccess: onClose })
  }
  return (
    <Dialog open onClose={onClose} title={`Renombrar ${device.name}`}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Nombre" error={error ?? undefined}>
          {(control) => (
            <Input
              {...control}
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
          )}
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={rename.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function DevicesPage() {
  const devices = useListDevices({ query: { select: (r) => r.data } })
  const revoke = useRevoke()
  const [dialog, setDialog] = useState<{ kind: 'rename' | 'revoke'; device: Device } | null>(null)
  const close = () => setDialog(null)

  return (
    <>
      <PageHeader
        title="Dispositivos"
        subtitle="Equipos del local donde meseros y cajeros entran con PIN."
      />
      <ThisDevice />

      {devices.isPending ? (
        <Skeleton className="h-48" />
      ) : devices.isError ? (
        <ErrorState
          message="No pudimos cargar los dispositivos."
          onRetry={() => devices.refetch()}
        />
      ) : devices.data.length === 0 ? (
        <EmptyState
          icon={MonitorSmartphone}
          title="Ningún equipo autorizado"
          description="Abre esta página desde cada tablet del local y autorízala."
        />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {devices.data.map((device) => (
            <li
              key={device.deviceId}
              className={cn(
                'flex flex-wrap items-center gap-3 px-4 py-3',
                !device.active && 'bg-muted/40',
              )}
            >
              <MonitorSmartphone className="size-6 text-accent" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-primary">{device.name}</p>
                <p className="text-sm text-muted-foreground">
                  {device.lastSeenAt
                    ? `Última actividad ${formatDateTime(device.lastSeenAt)}`
                    : 'Sin uso todavía'}
                </p>
              </div>
              <Badge tone={device.active ? 'available' : 'neutral'}>
                {device.active ? 'Autorizado' : 'Revocado'}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Renombrar ${device.name}`}
                onClick={() => setDialog({ kind: 'rename', device })}
              >
                <Pencil />
              </Button>
              {device.active ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setDialog({ kind: 'revoke', device })}
                  aria-label={`Revocar ${device.name}`}
                >
                  <ShieldOff /> Revocar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {dialog?.kind === 'rename' ? <RenameDialog device={dialog.device} onClose={close} /> : null}
      <ConfirmDialog
        open={dialog?.kind === 'revoke'}
        onClose={close}
        onConfirm={() =>
          dialog &&
          revoke.mutate(
            { id: dialog.device.deviceId },
            {
              onSuccess: () => {
                toast.success(`${dialog.device.name} revocado`)
                close()
              },
            },
          )
        }
        title={dialog ? `¿Revocar ${dialog.device.name}?` : ''}
        confirmLabel="Revocar"
        destructive
        pending={revoke.isPending}
      >
        Se cerrarán las sesiones abiertas en ese equipo y dejará de aceptar PIN. Para volver a
        usarlo hay que autorizarlo de nuevo desde él.
      </ConfirmDialog>
    </>
  )
}
