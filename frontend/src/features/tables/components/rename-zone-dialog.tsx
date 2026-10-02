import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useRenameZone } from '../hooks/use-table-admin'

export function RenameZoneDialog({
  open,
  onClose,
  zone,
  tableIds,
}: {
  open: boolean
  onClose: () => void
  zone: string
  tableIds: string[]
}) {
  const [name, setName] = useState(zone)
  const [error, setError] = useState<string | null>(null)
  const rename = useRenameZone()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return setError('Escribe la zona')
    if (clean.length > 50) return setError('Máximo 50 caracteres')
    if (clean === zone) return onClose()
    rename.mutate(
      { tableIds, zone: clean },
      {
        onSuccess: () => {
          toast.success(`Zona "${zone}" ahora es "${clean}"`)
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Renombrar zona ${zone}`}
      description={`Se moverán sus ${tableIds.length} mesas. Si el nombre ya existe, las zonas se unen.`}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Nuevo nombre" error={error ?? undefined}>
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
            Renombrar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
