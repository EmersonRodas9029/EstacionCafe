import { useState } from 'react'
import { toast } from 'sonner'
import type { PaymentMethod } from '@/api/generated/model/paymentMethod'
import { useListActiveCashRegisters } from '@/api/generated/cash-registers/cash-registers'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import { useChargeTable } from '../hooks/use-bill-actions'
import { usePreferencesStore } from '../preferences-store'
import { resolveCashRegister } from '../cash-register'
import { CashRegisterSelect } from './cash-register-select'
import { ChangeCalculator } from './change-calculator'
import { PaymentMethodPicker } from './payment-method-picker'

type Props = {
  open: boolean
  onClose: () => void
  tableId: string
  billsCount: number
  total: number
}

/** Cobra todas las cuentas en curso de la mesa y la libera. Solo cajero y admin. */
export function ChargeTableDialog({ open, onClose, tableId, billsCount, total }: Props) {
  const preferred = usePreferencesStore((s) => s.cashRegisterId)
  const setPreferred = usePreferencesStore((s) => s.setCashRegisterId)
  const registers = useListActiveCashRegisters({ query: { select: (r) => r.data } })
  const cashRegisterId = resolveCashRegister(registers.data, preferred)
  const charge = useChargeTable()
  const [method, setMethod] = useState<PaymentMethod>('cash')

  const confirm = () => {
    if (!cashRegisterId) return
    setPreferred(cashRegisterId)
    charge.mutate(
      { tableId, data: { cashRegisterId, paymentMethod: method } },
      {
        onSuccess: ({ data }) => {
          toast.success(
            `Mesa ${tableId} cobrada (${data.updated} ${data.updated === 1 ? 'cuenta' : 'cuentas'})`,
          )
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Cobrar mesa ${tableId}`}
      description={`${billsCount === 1 ? 'Se cobrará 1 cuenta' : `Se cobrarán ${billsCount} cuentas`} y la mesa quedará disponible.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="accent" onClick={confirm} disabled={!cashRegisterId || charge.isPending}>
            Cobrar {formatCurrency(total)}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-baseline justify-between rounded-lg bg-surface-soft px-4 py-3">
          <span className="text-muted-foreground">Total de la mesa</span>
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
