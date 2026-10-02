import type { BadgeTone } from '@/components/ui/badge'
import type { BillStatus } from '@/api/generated/model/billStatus'
import type { PaymentMethod } from '@/api/generated/model/paymentMethod'
import type { Role } from '@/api/generated/model/role'

export const BILL_STATUS: Record<BillStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'En edición', tone: 'neutral' },
  open: { label: 'Abierta', tone: 'occupied' },
  pending_payment: { label: 'Por cobrar', tone: 'pending' },
  closed: { label: 'Cobrada', tone: 'available' },
  finished: { label: 'Entregada', tone: 'reserved' },
  void: { label: 'Anulada', tone: 'void' },
}

/** Para llevar: en preparación → por cobrar → cobrada (por entregar) → entregada. */
export const TAKEAWAY_STAGE: Record<BillStatus, string> = {
  draft: 'En preparación',
  open: 'En preparación',
  pending_payment: 'Por cobrar',
  closed: 'Por entregar',
  finished: 'Entregada',
  void: 'Anulada',
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
}

export const isSold = (status: BillStatus) => status === 'closed' || status === 'finished'

/** Admite agregar o cambiar productos. */
export const isEditable = (status: BillStatus) => status === 'open' || status === 'draft'

/** En curso: aún no se cobra (la mesa sigue ocupada). */
export const isActive = (status: BillStatus) => isEditable(status) || status === 'pending_payment'

/** Cobrar es del cajero y el admin; el mesero solo cierra la cuenta. */
export const canCharge = (role: Role | null | undefined) => role === 'cajero' || role === 'admin'
