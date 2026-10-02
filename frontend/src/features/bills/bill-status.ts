import type { BadgeTone } from '@/components/ui/badge'
import type { BillStatus } from '@/api/generated/model/billStatus'

export const BILL_STATUS: Record<BillStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'En edición', tone: 'neutral' },
  open: { label: 'Abierta', tone: 'occupied' },
  finished: { label: 'Entregada', tone: 'reserved' },
  closed: { label: 'Cobrada', tone: 'available' },
}

/** Para llevar: abierta = en preparación → cobrada = por entregar → entregada. */
export const TAKEAWAY_STAGE: Record<BillStatus, string> = {
  draft: 'En preparación',
  open: 'En preparación',
  closed: 'Por entregar',
  finished: 'Entregada',
}

export const isSold = (status: BillStatus) => status === 'closed' || status === 'finished'

export const isEditable = (status: BillStatus) => status === 'open' || status === 'draft'
