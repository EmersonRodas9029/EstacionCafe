import { lineSubtotal, purchaseFormSchema } from './schemas'

const base = {
  date: '2026-03-10T10:00',
  supplierId: '1',
  cashRegisterId: '',
  mode: 'stock' as const,
  details: [{ consumableId: '1', quantity: '1000', unitCost: '0.025' }],
  total: '',
}

describe('purchaseFormSchema', () => {
  it('acepta compras con inventario', () => {
    expect(purchaseFormSchema.parse(base)).toMatchObject({
      supplierId: 1,
      cashRegisterId: undefined,
      details: [{ consumableId: 1, quantity: 1000, unitCost: 0.025 }],
    })
  })

  it('exige líneas sin repetir, o un total si es gasto', () => {
    const empty = purchaseFormSchema.safeParse({ ...base, details: [] })
    expect(empty.error?.issues[0]?.message).toBe('Agrega al menos un consumible')

    const repeated = purchaseFormSchema.safeParse({
      ...base,
      details: [...base.details, { consumableId: '1', quantity: '1', unitCost: '1' }],
    })
    expect(repeated.error?.issues[0]?.path).toEqual(['details', 1, 'consumableId'])

    const expense = purchaseFormSchema.safeParse({ ...base, mode: 'expense', details: [] })
    expect(expense.error?.issues[0]?.message).toBe('Escribe el total')
    expect(
      purchaseFormSchema.safeParse({ ...base, mode: 'expense', details: [], total: '12.5' })
        .success,
    ).toBe(true)
  })

  it('redondea el subtotal de la línea a centavos', () => {
    expect(lineSubtotal('1000', '0.0025')).toBe(2.5)
    expect(lineSubtotal('3', '0.333')).toBe(1)
    expect(lineSubtotal('', '2')).toBe(0)
  })
})
