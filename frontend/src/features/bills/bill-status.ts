import type { BadgeTone } from '@/components/ui/badge'
import type { BillStatus } from '@/api/generated/model/billStatus'

export const BILL_STATUS: Record<BillStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'En edición', tone: 'neutral' },
  open: { label: 'Abierta', tone: 'occupied' },
  finished: { label: 'Entregada', tone: 'reserved' },
  closed: { label: 'Cobrada', tone: 'available' },
}

export const isEditable = (status: BillStatus) => status === 'open' || status === 'draft'
