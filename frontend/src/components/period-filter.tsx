import { ChipGroup } from '@/components/ui/chip-group'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { localDay } from '@/lib/dates'
import { PRESETS, presetPeriod, type Period, type Preset, type usePeriod } from '@/lib/period'

/** Atajos (Hoy, Ayer, 7 días…) más fechas Desde/Hasta en días de El Salvador. */
export function PeriodFilter({
  state,
  onChange,
}: {
  state: ReturnType<typeof usePeriod>
  onChange?: () => void
}) {
  const today = localDay()
  const { preset, setPreset, period, setPeriod } = state

  const choose = (next: Preset) => {
    setPreset(next)
    if (next !== 'custom') setPeriod(presetPeriod(next, today))
    onChange?.()
  }

  const setDay = (key: keyof Period, value: string) => {
    if (!value) return
    setPreset('custom')
    // Rango invertido: el otro extremo se mueve a la misma fecha
    setPeriod((current) => {
      const next = { ...current, [key]: value }
      return next.from > next.to ? { from: value, to: value } : next
    })
    onChange?.()
  }

  return (
    <div className="space-y-4">
      <ChipGroup label="Periodo" value={preset} onChange={choose} options={PRESETS} />
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <FormField label="Desde">
          {(control) => (
            <Input
              {...control}
              type="date"
              max={today}
              value={period.from}
              onChange={(e) => setDay('from', e.target.value)}
            />
          )}
        </FormField>
        <FormField label="Hasta">
          {(control) => (
            <Input
              {...control}
              type="date"
              max={today}
              value={period.to}
              onChange={(e) => setDay('to', e.target.value)}
            />
          )}
        </FormField>
      </div>
    </div>
  )
}
