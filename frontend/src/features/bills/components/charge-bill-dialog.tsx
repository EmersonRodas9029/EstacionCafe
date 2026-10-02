import { useState } from 'react'
import { toast } from 'sonner'
import type { PaymentMethod } from '@/api/generated/model/paymentMethod'
import { useListActiveCashRegisters } from '@/api/generated/cash-registers/cash-registers'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import { resolveCashRegister } from '../cash-register'
import { useEditBill } from '../hooks/use-bill-actions'
import { usePreferencesStore } from '../preferences-store'
import { CashRegisterSelect } from './cash-register-select'
import { ChangeCalculator } from './change-calculator'
import { PaymentMethodPicker } from './payment-method-picker'

type Props = {
  open: boolean
  onClose: () => void
  billId: number
  customer: string
  total: number
  onCharged?: () => void
}

/** Cobra una sola cuenta (closed + caja + método de pago). Solo cajero y admin. */
export function ChargeBillDialog({ open, onClose, billId, customer, total, onCharged }: Props) {
  const preferred = usePreferencesStore((s) => s.cashRegisterId)
  const setPreferred = usePreferencesStore((s) => s.setCashRegisterId)
  const registers = useListActiveCashRegisters({ query: { enabled: open, select: (r) => r.data } })
  const cashRegisterId = resolveCashRegister(registers.data, preferred)
  const editBill = useEditBill()
  const [method, setMethod] = useState<PaymentMethod>('cash')

  const confirm = () => {
    if (!cashRegisterId) return
    setPreferred(cashRegisterId)
    editBill.mutate(
      { id: billId, data: { status: 'closed', cashRegisterId, paymentMethod: method } },
      {
        onSuccess: () => {
          toast.success(
            `Cuenta "${customer}" cobrada con ${method === 'cash' ? 'efectivo' : 'tarjeta'}`,
          )
          onClose()
          onCharged?.()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Cobrar · ${customer}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="accent"
            onClick={confirm}
            disabled={!cashRegisterId || editBill.isPending}
          >
            Cobrar {formatCurrency(total)}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-baseline justify-between rounded-lg bg-surface-soft px-4 py-3">
          <span className="text-muted-foreground">Total</span>
          <span className="font-display text-3xl font-semibold text-primary tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
        <PaymentMethodPicker value={method} onChange={setMethod} />
        <CashRegisterSelect value={cashRegisterId} onChange={setPreferred} />
        {open && method === 'cash' ? <ChangeCalculator total={total} /> : null}
      </div>
    </Dialog>
  )
}
