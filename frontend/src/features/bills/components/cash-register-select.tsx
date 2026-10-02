import { useListActiveCashRegisters } from '@/api/generated/cash-registers/cash-registers'
import { FormField } from '@/components/ui/form-field'
import { Select } from '@/components/ui/select'

/** Selector de caja activa. `value` ya resuelto con resolveCashRegister. */
export function CashRegisterSelect({
  value,
  onChange,
}: {
  value: number | null
  onChange: (id: number) => void
}) {
  const registers = useListActiveCashRegisters({ query: { select: (r) => r.data } })
  const list = registers.data ?? []

  return (
    <FormField
      label="Caja"
      hint={
        !registers.isPending && list.length === 0
          ? 'No hay cajas activas; pide a un administrador que habilite una.'
          : undefined
      }
    >
      {(control) => (
        <Select
          {...control}
          value={value ?? ''}
          disabled={registers.isPending || list.length === 0}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          <option value="" disabled>
            {registers.isPending ? 'Cargando cajas…' : 'Selecciona una caja'}
          </option>
          {list.map((r) => (
            <option key={r.cashRegisterId} value={r.cashRegisterId}>
              Caja {r.number}
            </option>
          ))}
        </Select>
      )}
    </FormField>
  )
}
