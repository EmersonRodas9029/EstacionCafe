import {
  formatCurrency,
  formatPhone,
  formatQuantity,
  formatUnitCost,
  marginPercent,
} from './format'

describe('format', () => {
  it('formatea USD', () => {
    expect(formatCurrency(15.5)).toBe('$15.50')
  })

  it('calcula margen sobre precio', () => {
    expect(marginPercent(4, 1)).toBe(75)
    expect(marginPercent(0, 1)).toBe(0)
  })
})

describe('formatos de inventario', () => {
  it('formatea teléfonos de El Salvador', () => {
    expect(formatPhone('22223333')).toBe('2222-3333')
    expect(formatPhone('+50377778888')).toBe('+503 7777-8888')
    expect(formatPhone('123')).toBe('123')
  })

  it('muestra cantidades y costos unitarios sin perder decimales', () => {
    expect(formatQuantity(17.8)).toBe('17.8')
    expect(formatQuantity(4784)).toBe('4,784')
    expect(formatUnitCost(0.0025)).toBe('$0.0025')
    expect(formatUnitCost(1.2)).toBe('$1.20')
  })
})
