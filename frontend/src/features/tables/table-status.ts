import { CalendarClock, CircleCheck, Utensils, type LucideIcon } from 'lucide-react'
import type { BadgeTone } from '@/components/ui/badge'
import type { TableStatus } from '@/api/generated/model/tableStatus'

export const TABLE_STATUS: Record<
  TableStatus,
  { label: string; tone: BadgeTone; icon: LucideIcon }
> = {
  disponible: { label: 'Disponible', tone: 'available', icon: CircleCheck },
  ocupada: { label: 'Ocupada', tone: 'occupied', icon: Utensils },
  reservada: { label: 'Reservada', tone: 'reserved', icon: CalendarClock },
}
