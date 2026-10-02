import { useState } from 'react'
import { localDay, monthStart, shiftDay } from './dates'

export type Period = { from: string; to: string }
export type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'last30' | 'custom'

export const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'week', label: 'Últimos 7 días' },
  { value: 'month', label: 'Este mes' },
  { value: 'last30', label: 'Últimos 30 días' },
  { value: 'custom', label: 'Personalizado' },
]

export const presetPeriod = (preset: Exclude<Preset, 'custom'>, today = localDay()): Period => {
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday':
      return { from: shiftDay(today, -1), to: shiftDay(today, -1) }
    case 'week':
      return { from: shiftDay(today, -6), to: today }
    case 'month':
      return { from: monthStart(today), to: today }
    case 'last30':
      return { from: shiftDay(today, -29), to: today }
  }
}

/** Estado del periodo con atajo inicial. */
export function usePeriod(initial: Exclude<Preset, 'custom'> = 'today') {
  const [preset, setPreset] = useState<Preset>(initial)
  const [period, setPeriod] = useState(() => presetPeriod(initial))
  return { preset, setPreset, period, setPeriod }
}

export const describePeriod = ({ from, to }: Period) =>
  from === to ? `Del ${from}` : `Del ${from} al ${to}`
