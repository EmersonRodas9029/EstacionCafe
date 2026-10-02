import { useEffect, useRef, useState } from 'react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const NEW_ZONE = '__nueva__'

/**
 * Zona de la mesa: combo con las zonas existentes y "+ Nueva zona…", que abre
 * un campo para escribirla. Igual en todos los navegadores (sin <datalist>).
 */
export function ZoneSelect({
  value,
  onChange,
  zones,
  error,
  autoFocus,
}: {
  value: string
  onChange: (zone: string) => void
  zones: string[]
  error?: string
  autoFocus?: boolean
}) {
  // Sin zonas todavía, o con una que no está en la lista: se escribe
  const [creating, setCreating] = useState(
    zones.length === 0 || (!!value && !zones.includes(value)),
  )
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creating && zones.length > 0) inputRef.current?.focus()
  }, [creating, zones.length])

  return (
    <div className="space-y-4">
      {zones.length > 0 ? (
        <FormField label="Zona" error={creating ? undefined : error}>
          {(control) => (
            <Select
              {...control}
              autoFocus={autoFocus}
              value={creating ? NEW_ZONE : value}
              onChange={(e) => {
                if (e.target.value === NEW_ZONE) {
                  setCreating(true)
                  onChange('')
                } else {
                  setCreating(false)
                  onChange(e.target.value)
                }
              }}
            >
              <option value="" disabled>
                Elige una zona
              </option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
              <option value={NEW_ZONE}>+ Nueva zona…</option>
            </Select>
          )}
        </FormField>
      ) : null}
      {creating ? (
        <FormField
          label={zones.length > 0 ? 'Nombre de la zona' : 'Zona'}
          error={error}
          hint="Ej. Interior, Terraza, Barra"
        >
          {(control) => (
            <Input
              {...control}
              ref={inputRef}
              autoFocus={autoFocus && zones.length === 0}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </FormField>
      ) : null}
    </div>
  )
}
