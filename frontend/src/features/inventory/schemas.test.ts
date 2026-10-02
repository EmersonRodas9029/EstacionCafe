import { adjustedStock, consumableFormSchema } from './schemas'

describe('inventario', () => {
  it('calcula el ajuste de stock sin permitir negativos', () => {
    expect(adjustedStock(10, 'add', 2.5)).toBe(12.5)
    expect(adjustedStock(10, 'remove', 4)).toBe(6)
    expect(adjustedStock(10, 'remove', 11)).toBeNull()
    expect(adjustedStock(10, 'set', 3)).toBe(3)
    expect(adjustedStock(0.1, 'add', 0.2)).toBe(0.3)
  })

  it('valida el consumible con costo de hasta 4 decimales', () => {
    const base = {
      name: 'Leche',
      consumableTypeId: '2',
      supplierId: '1',
      unitMeasurement: 'ml',
      cost: '0.0025',
      minStock: '1000',
      quantity: '0',
    }
    expect(consumableFormSchema.parse(base)).toMatchObject({ cost: 0.0025, minStock: 1000 })
    expect(
      consumableFormSchema.safeParse({ ...base, cost: '0.00251' }).error?.issues[0]?.message,
    ).toBe('Máximo 4 decimales')
    expect(
      consumableFormSchema.safeParse({ ...base, supplierId: '' }).error?.issues[0]?.message,
    ).toBe('Elige un proveedor')
  })
})
